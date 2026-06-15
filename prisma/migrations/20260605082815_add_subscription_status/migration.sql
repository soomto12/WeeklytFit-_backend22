-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'cancelled');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "restDays" TEXT[];

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'active';
