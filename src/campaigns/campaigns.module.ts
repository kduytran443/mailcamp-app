import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PgbossModule } from 'src/pgboss/pgboss.module';
import { CampaignsProcessor } from './campaigns.processor';

@Module({
  imports: [PrismaModule, PgbossModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignsProcessor]
})
export class CampaignsModule {}
