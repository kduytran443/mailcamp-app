import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateCampaignDto {
  // Basic metadata
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  content: string;

  // Subscribers passed directly for scheduling
  @IsNotEmpty()
  subscribers: SubscriberInput[];

  // Scheduling config
  @IsNotEmpty()
  scheduleType: 'ONE_TIME' | 'RECURRING'; // match enum ScheduleType

  @IsOptional()
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'; // for RECURRING type

  /**
   * Local datetime string chosen by user in UI
   * Example: "2025-11-11T09:00:00" (no timezone)
   * We will convert this into each subscriber's timezone → UTC
   */
  @IsNotEmpty()
  sendAtLocal: string;

  /**
   * Weekly recurrence: ["MO", "WE", "FR"]
   * Only required if scheduleType === "WEEKLY"
   */
  @IsOptional()
  byDay?: string[];

  /**
   * Monthly recurrence: [1, 15, 28]
   * Only required if scheduleType === "MONTHLY"
   */
  @IsOptional()
  byMonthDay?: number[];

  @IsNotEmpty()
  workspaceId: string;
}

export class SubscriberInput {
  email: string;
  timezone: string; // "Asia/Ho_Chi_Minh", "Europe/London"
}
