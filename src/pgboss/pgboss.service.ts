import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import PgBoss from 'pg-boss';
import { CONSTANT_DATABASE_URL } from 'src/app/app.constants';

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
    await this.boss.createQueue('send-birthday-email');
    this.logger.info('pg-boss started');
  }

  async onModuleDestroy(): Promise<void> {
    this.boss.stop();
    this.logger.info('pg-boss stopped');
  }
  
  async publish(name: string, data: any, options?: any) {
    return this.boss.publish(name, data, options);
  }

  getInstance(): PgBoss {
    return this.boss;
  }
}
