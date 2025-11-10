import { Module } from '@nestjs/common';
import { PgbossService } from './pgboss.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PgbossService],
  exports: [PgbossService],
})
export class PgbossModule {}
