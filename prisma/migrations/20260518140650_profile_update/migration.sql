/*
  Warnings:

  - You are about to drop the column `localtion` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "localtion",
ADD COLUMN     "location" "localtion" NOT NULL DEFAULT 'both';
