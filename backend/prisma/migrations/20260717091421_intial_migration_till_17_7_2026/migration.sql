/*
  Warnings:

  - You are about to drop the column `location` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "location",
ADD COLUMN     "carbonDebt" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ecoScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "homeLocation" geometry(Point, 4326),
ADD COLUMN     "lastActivityDate" TIMESTAMP(3),
ADD COLUMN     "lifetimeCarbon" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "treesToOffset" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantationEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "organizerName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "locationName" TEXT NOT NULL,
    "siteBoundary" geometry(Polygon, 4326) NOT NULL,
    "centroid" geometry(Point, 4326) NOT NULL,
    "treesPlanted" INTEGER NOT NULL DEFAULT 0,
    "treesGoal" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantationId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "treesContributed" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpactLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AQILog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aqiValue" INTEGER NOT NULL,
    "location" geometry(Point, 4326) NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AQILog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarbonBill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billType" TEXT NOT NULL,
    "rawText" TEXT,
    "totalUnits" DOUBLE PRECISION NOT NULL,
    "carbonKg" DOUBLE PRECISION NOT NULL,
    "billDate" TIMESTAMP(3),
    "imagePath" TEXT,
    "extractedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarbonBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "carbonKg" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🎯',
    "targetCategory" TEXT NOT NULL,
    "targetActivity" TEXT,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL DEFAULT 30,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userId_friendId_key" ON "Friendship"("userId", "friendId");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactLedger_userId_plantationId_key" ON "ImpactLedger"("userId", "plantationId");

-- CreateIndex
CREATE INDEX "AQILog_userId_timestamp_idx" ON "AQILog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AQILog_expiresAt_idx" ON "AQILog"("expiresAt");

-- CreateIndex
CREATE INDEX "CarbonBill_userId_createdAt_idx" ON "CarbonBill"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_date_idx" ON "ActivityLog"("userId", "date");

-- CreateIndex
CREATE INDEX "WeeklyChallenge_userId_weekStart_idx" ON "WeeklyChallenge"("userId", "weekStart");

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactLedger" ADD CONSTRAINT "ImpactLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactLedger" ADD CONSTRAINT "ImpactLedger_plantationId_fkey" FOREIGN KEY ("plantationId") REFERENCES "PlantationEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AQILog" ADD CONSTRAINT "AQILog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarbonBill" ADD CONSTRAINT "CarbonBill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyChallenge" ADD CONSTRAINT "WeeklyChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
