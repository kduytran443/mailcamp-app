import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PgbossService } from 'src/pgboss/pgboss.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import dayjs from 'dayjs';
import { TimezoneJob } from './dto/timezone-job.dto';

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
      scheduleType,       // "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY"
      sendAtLocal,        // local time input by user (ISO string)
      byDay,              // e.g. ["MO","WE"] for weekly
      byMonthDay,         // e.g. [1,15] for monthly
      workspaceId
    } = dto;

    // -------------------------------------------------------
    // 1) Create campaign (only top-level info)
    // -------------------------------------------------------
    const campaign = await this.prisma.campaign.create({
      data: {
        name,
        content,
        scheduleType,
        byDay,
        byMonthDay,
        workspaceId
      },
    });

    // -------------------------------------------------------
    // 2) Group subscribers by timezone
    // -------------------------------------------------------
    const tzMap: Record<string, string[]> = {};

    for (const s of subscribers) {
      if (!tzMap[s.timezone]) tzMap[s.timezone] = [];
      tzMap[s.timezone].push(s.email);
    }

    // -------------------------------------------------------
    // 3) For each timezone → compute firstRunUTC + publish job
    // -------------------------------------------------------
    const timezoneJobs: TimezoneJob[] = [];

    for (const timezone of Object.keys(tzMap)) {
      const emails = tzMap[timezone];

      // Convert the local "sendAtLocal" to UTC by subscriber timezone
      const firstRunUTC = this.convertLocalToUTC(sendAtLocal, timezone);

      // Build idempotent job key
      const jobKey = `campaign:${campaign.id}:tz:${timezone}:${firstRunUTC.toISOString()}`;

      // Prepare payload for worker
      const payload = {
        campaignId: campaign.id,
        timezone,
        emails, // worker will load these emails directly
      };

      // Build pg-boss options
      const jobOptions = {
        jobKey,            // ensure idempotency
        startAfter: firstRunUTC,
        retryLimit: 5,
        ...this.buildRecurring(scheduleType),
      };

      // Publish job to pg-boss
      await this.boss.publish('campaign-send', payload, jobOptions);

      timezoneJobs.push({ timezone, firstRunUTC, count: emails.length });
    }

    return {
      campaign,
      timezoneJobs,
    };
  }

  private buildRecurring(scheduleType: string) {
    // Note:
    // pg-boss does not support full cron rules.
    // The worker itself will enforce weekly/monthly constraints.
    if (scheduleType === 'DAILY') {
      return { interval: '1 day' };
    }

    if (scheduleType === 'WEEKLY') {
      // fire every day; worker checks if today is in byDay
      return { interval: '1 day' };
    }

    if (scheduleType === 'MONTHLY') {
      // fire every day; worker checks if today matches byMonthDay
      return { interval: '1 day' };
    }

    // ONCE: do not set interval (one-time execution)
    return {};
  }

  private convertLocalToUTC(localISO: string, tz: string): Date {
    return dayjs.tz(localISO, tz).utc().toDate();
  }
}
