import { Injectable, OnModuleInit } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { PgbossService } from 'src/pgboss/pgboss.service';
interface CampaignJobPayload {
  campaignId: string;
  timezone: string;
  emails: string[];
  id: string;
  jobKey?: string; // nếu bạn muốn gắn key
}

@Injectable()
export class CampaignsProcessor implements OnModuleInit {
  constructor(private readonly boss: PgbossService) {}

  onModuleInit() {
    this.startWorkers();
  }

  async startWorkers() {
    console.log("Init campaign worker")
    const boss = await this.boss.getInstance();
    boss.start();

    await boss.work<CampaignJobPayload>(
      'campaign-send',
      async (jobs: PgBoss.Job<CampaignJobPayload>[]) => {
        console.log("Nhận message")
        for (const job of jobs) {
          console.log('Job id:', job.id);
          console.log('Job name:', job.name);
          console.log('Emails:', job.data.emails);
          console.log('Timezone:', job.data.timezone);
          console.log('JobKey:', job.data.jobKey);

          // TODO: xử lý gửi mail
        }
      }
    );
  }
}
