import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PgbossService } from 'src/pgboss/pgboss.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CreateCampaignDto, SubscriberInput } from './dto/create-campaign.dto';
import { CampaignDetailDto, CampaignDto } from './dto/campaign.dto';
import { Campaign } from '@prisma/client';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private boss: PgbossService,
  ) {}

  async findAll(
  workspaceId: string,
  page = 1,
  pageSize = 20,
  search?: string,
  ) {
    const where: any = { workspaceId };

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.campaign.count({ where }),
      this.prisma.campaign.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: items.map((c) => this.mapCampaign(c)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private mapCampaign(c: Campaign): CampaignDto {
    return {
      id: c.id,
      name: c.name,
      subject: c.subject,
      content: c.content,
      workspaceId: c.workspaceId,
      status: c.status,
      schedule: c.schedule,
      scheduleType: c.scheduleType,
      recurrenceType: c.recurrenceType,
      hour: c.hour,
      minute: c.minute,
      byDay: c.byDay,
      byMonthDay: c.byMonthDay,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      type: c.type,
    };
  }

  async findOne(id: string, workspaceId: string): Promise<CampaignDetailDto | null> {
    const c = await this.prisma.campaign.findFirst({
      where: { id, workspaceId },
      include: {
        subscribers: {
          include: {
            subscriber: {
              include: {
                tags: true,
              },
            },
          },
        },
      },
    });
    if (!c) return null;

    return {
      ...this.mapCampaign(c),
      subscribers: c.subscribers.map(s => ({
        id: s.id,
        name: s?.subscriber?.name,
        email: s?.subscriber?.email,
        timezone: s?.subscriber?.timezone,
        tags: s?.subscriber.tags.map(t => t.name),
      })),
    };
  }

  async createCampaign(dto: CreateCampaignDto) {
    const {
      name,
      content,
      subscribers = [],
      scheduleType,
      recurrenceType,
      sendAtLocal,
      byDay = [],
      byMonthDay = [],
      workspaceId,
    } = dto;

    // 1️⃣ Create campaign record
    const campaign = await this.prisma.campaign.create({
      data: {
        name,
        content,
        scheduleType,
        recurrenceType,
        byDay,
        byMonthDay,
        workspaceId,
        schedule: sendAtLocal ? new Date(sendAtLocal) : null,
      },
    });

    // 2️⃣ Create subscribers and campaign-subscriber relation
    for (const s of subscribers) {
      // Check if subscriber with same email exists in workspace
      let subscriber = await this.prisma.subscriber.findUnique({
        where: { workspaceId_email: { workspaceId, email: s.email } },
      });

      if (!subscriber) {
        // Create new subscriber
        subscriber = await this.prisma.subscriber.create({
          data: {
            email: s.email,
            timezone: s.timezone,
            workspaceId,
          },
        });
      }

      // Create CampaignSubscriber
      await this.prisma.campaignSubscriber.create({
        data: {
          campaignId: campaign.id,
          subscriberId: subscriber.id,
        },
      });
    }

    // Group subscribers by timezone
    const tzMap: Record<string, SubscriberInput[]> = {};
    for (const s of subscribers) {
      if (!tzMap[s.timezone]) tzMap[s.timezone] = [];
      tzMap[s.timezone].push(s);
    }

    // Schedule jobs per timezone
    const queueName = 'campaign-send'; // 1 queue chung
    for (const [tz, subs] of Object.entries(tzMap)) {
      const emails = subs.map(s => s.email);
      const payload = { campaignId: campaign.id, timezone: tz, emails };

      if (scheduleType === 'ONE_TIME') {
        // const runAtUTC = dayjs.tz(sendAtLocal, tz).utc().toDate();
        // await this.boss.getInstance().schedule(queueName, runAtUTC, payload, {
        //   retryLimit: 5,
        // });
      } else if (scheduleType === 'RECURRING') {
        // dtLocal = local datetime trong timezone của subscriber
        const dtLocal = dayjs.tz(sendAtLocal, tz);
        const minute = dtLocal.minute();
        const hour = dtLocal.hour();

        let cron = `${minute} ${hour} * * *`; // default daily

        switch (recurrenceType) {
          case 'DAILY':
            cron = `${minute} ${hour} * * *`;
            break;
          case 'WEEKLY':
            if (byDay.length > 0) {
              const dowMap: Record<string, string> = { SU:'0', MO:'1', TU:'2', WE:'3', TH:'4', FR:'5', SA:'6' };
              const days = byDay.map(d => dowMap[d]).join(',');
              cron = `${minute} ${hour} * * ${days}`;
            }
            break;
          case 'MONTHLY':
            if (byMonthDay.length > 0) {
              cron = `${minute} ${hour} ${byMonthDay.join(',')} * *`;
            }
            break;
          case 'YEARLY':
            const month = dtLocal.month() + 1;
            const day = dtLocal.date();
            cron = `${minute} ${hour} ${day} ${month} *`;
            break;
        }

        const jobKey = `campaign:${campaign.id}:tz:${tz}`;

        this.boss.getInstance().schedule(queueName, cron, payload, {
          retryLimit: 5,
          key: jobKey,
          tz,
        });
      }
    }

    return campaign;
  }
}
