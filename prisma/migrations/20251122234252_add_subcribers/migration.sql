/*
  Warnings:

  - You are about to drop the `CampaignAudience` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CampaignAudience" DROP CONSTRAINT "CampaignAudience_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CampaignAudience" DROP CONSTRAINT "CampaignAudience_subscriberId_fkey";

-- DropTable
DROP TABLE "public"."CampaignAudience";

-- CreateTable
CREATE TABLE "CampaignSubscriber" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,

    CONSTRAINT "CampaignSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignSubscriber_campaignId_subscriberId_key" ON "CampaignSubscriber"("campaignId", "subscriberId");

-- AddForeignKey
ALTER TABLE "CampaignSubscriber" ADD CONSTRAINT "CampaignSubscriber_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSubscriber" ADD CONSTRAINT "CampaignSubscriber_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
