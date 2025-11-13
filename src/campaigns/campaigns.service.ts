import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PgbossService } from 'src/pgboss/pgboss.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CreateCampaignDto, SubscriberInput } from './dto/create-campaign.dto';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private boss: PgbossService,
  ) {}

  async createCampaign(dto: CreateCampaignDto) {
    const {
      name,
      content,
      subscribers,
      scheduleType,
      recurrenceType,
      sendAtLocal,
      byDay = [],
      byMonthDay = [],
      workspaceId,
    } = dto;

    // 1) Create campaign record
    const campaign = await this.prisma.campaign.create({
      data: {
        name,
        content,
        scheduleType,
        recurrenceType,
        byDay,
        byMonthDay,
        workspaceId,
        schedule: new Date(sendAtLocal),
      },
    });

    // 2) Group subscribers by timezone
    const tzMap: Record<string, SubscriberInput[]> = {};
    for (const s of subscribers) {
      if (!tzMap[s.timezone]) tzMap[s.timezone] = [];
      tzMap[s.timezone].push(s);
    }

    // 3) Schedule jobs per timezone
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
