export interface TimezoneJob {
  timezone: string;
  firstRunUTC: Date;
  count: number;
}

export interface TimezoneJobStatus {
  timezone: string;
  emailsTotal: number;
  emailsSent: number;
  jobKey: string;
  jobState: string;
  firstRunUTC: Date;
}
