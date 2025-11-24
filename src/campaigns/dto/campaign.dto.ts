import { CampaignStatus, CampaignType, RecurrenceType, ScheduleType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CampaignDto {
  id: string
  name: string
  subject: string | null
  content: string | null
  workspaceId: string
  status: CampaignStatus
  schedule: Date | null
  type: CampaignType
  createdAt: Date
  updatedAt: Date
  scheduleType: ScheduleType | null
  recurrenceType: RecurrenceType | null
  hour: number | null
  minute: number | null
  byDay: string[]
  byMonthDay: number[]
}

export class CampaignDetailDto extends CampaignDto {
  subscribers: {id, name, email, timezone, tags: string[]} []
}

export class ListCampaignsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsString()
  workspaceId: string;
}
