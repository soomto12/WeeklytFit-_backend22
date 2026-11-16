-- Baseline: these changes were already applied to the database outside of migrations
-- (via `prisma db push`). This migration is marked as applied, not run.

-- CreateEnum
CREATE TYPE "logStatus" AS ENUM ('done', 'unable', 'missed', 'pending');

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "tier" DROP NOT NULL;

-- CreateTable
CREATE TABLE "dailyLogs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "aiResultId" INTEGER NOT NULL,
    "sunday" "logStatus" NOT NULL DEFAULT 'pending',
    "monday" "logStatus" NOT NULL DEFAULT 'pending',
    "tuesday" "logStatus" NOT NULL DEFAULT 'pending',
    "wednesday" "logStatus" NOT NULL DEFAULT 'pending',
    "thursday" "logStatus" NOT NULL DEFAULT 'pending',
    "friday" "logStatus" NOT NULL DEFAULT 'pending',
    "saturday" "logStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "dailyLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freeLimit" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "limitCount" INTEGER NOT NULL,

    CONSTRAINT "freeLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userid_key" ON "Profile"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dailyLogs_aiResultId_key" ON "dailyLogs"("aiResultId");

-- CreateIndex
CREATE UNIQUE INDEX "freeLimit_userId_key" ON "freeLimit"("userId");

-- AddForeignKey
ALTER TABLE "dailyLogs" ADD CONSTRAINT "dailyLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dailyLogs" ADD CONSTRAINT "dailyLogs_aiResultId_fkey" FOREIGN KEY ("aiResultId") REFERENCES "Ai_Result"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freeLimit" ADD CONSTRAINT "freeLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
