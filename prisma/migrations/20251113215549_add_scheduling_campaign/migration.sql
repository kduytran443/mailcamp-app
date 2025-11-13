-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('ONE_TIME', 'RECURRING');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "byDay" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "byMonthDay" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "hour" INTEGER,
ADD COLUMN     "minute" INTEGER,
ADD COLUMN     "recurrenceType" "RecurrenceType",
ADD COLUMN     "scheduleType" "ScheduleType";

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN     "timezone" TEXT DEFAULT 'Asia/Ho_Chi_Minh';

-- CreateTable
CREATE TABLE "EmailSendLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSendLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSendLog_campaignId_subscriberId_key" ON "EmailSendLog"("campaignId", "subscriberId");
