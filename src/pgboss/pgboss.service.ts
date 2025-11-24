import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import PgBoss from 'pg-boss';
import { CONSTANT_DATABASE_URL } from 'src/app/app.constants';
interface CampaignJobPayload {
  campaignId: string;
  timezone: string;
  emails: string[];
  id: string;
  jobKey?: string;
}
@Injectable()
export class PgbossService implements OnModuleInit, OnModuleDestroy {
  private boss: PgBoss;

  constructor(
    private readonly configService: ConfigService,
    private logger: PinoLogger
  ) {
    this.logger.setContext(PgbossService.name);
  };

  async onModuleInit(): Promise<void> {
    this.boss = new PgBoss({
      connectionString: this.configService.getOrThrow(CONSTANT_DATABASE_URL),
      max: 20
    });
    await this.boss.start();
    await this.boss.createQueue('campaign-send');
    this.logger.info('pg-boss started');
    this.test();
  }

  async test() {
    const queue = 'readme-queue'

    await this.boss.createQueue(queue)

    const id = await this.boss.send(queue, { arg1: 'read me' })

    await this.boss.work(queue, async ([ job ]) => {
      console.log(`received job ${job.id} with data ${JSON.stringify(job.data)}`)
    })
  }

  async onModuleDestroy(): Promise<void> {
    this.boss.stop();
    this.logger.info('pg-boss stopped');
  }
  
  async publish(name: string, data: any, options?: any) {
    return this.boss.publish(name, data, options);
  }

  async getJobByKey(jobKey: string) {
    // PG Boss does not support direct lookup by jobKey,
    // so we query queue for matching jobs
  }

  getInstance(): PgBoss {
    return this.boss;
  }
}
