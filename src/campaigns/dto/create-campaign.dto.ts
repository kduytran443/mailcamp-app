import { IsNotEmpty } from "class-validator";

export class CreateCampaignDto {
  // Basic metadata
  name: string;
  content: string;

  // Subscribers passed directly for scheduling
  subscribers: SubscriberInput[];

  // Scheduling config
  scheduleType: 'ONE_TIME' | 'RECURRING'; // match enum ScheduleType
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'; // for RECURRING type

  /**
   * Local datetime string chosen by user in UI
   * Example: "2025-11-11T09:00:00" (no timezone)
   * We will convert this into each subscriber's timezone → UTC
   */
  sendAtLocal: string;

  /**
   * Weekly recurrence: ["MO", "WE", "FR"]
   * Only required if scheduleType === "WEEKLY"
   */
  byDay?: string[];

  /**
   * Monthly recurrence: [1, 15, 28]
   * Only required if scheduleType === "MONTHLY"
   */
  byMonthDay?: number[];

  @IsNotEmpty()
  workspaceId: string;
}

export class SubscriberInput {
  email: string;
  timezone: string; // "Asia/Ho_Chi_Minh", "Europe/London"
}
