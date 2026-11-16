-- CreateEnum
CREATE TYPE "weekDay" AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');

-- CreateEnum
CREATE TYPE "mealType" AS ENUM ('breakfast', 'lunch', 'dinner');

-- DropForeignKey
ALTER TABLE "dailyLogs" DROP CONSTRAINT "dailyLogs_aiResultId_fkey";

-- AlterTable
ALTER TABLE "Ai_Result" DROP COLUMN "dailyPlans";

-- CreateTable
CREATE TABLE "Exercise" (
    "id" SERIAL NOT NULL,
    "aiResultId" INTEGER NOT NULL,
    "day" "weekDay" NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "rest" INTEGER NOT NULL,
    "youtubeUrl" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" SERIAL NOT NULL,
    "aiResultId" INTEGER NOT NULL,
    "day" "weekDay" NOT NULL,
    "mealType" "mealType" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercise_aiResultId_day_idx" ON "Exercise"("aiResultId", "day");

-- CreateIndex
CREATE INDEX "Food_aiResultId_day_idx" ON "Food"("aiResultId", "day");

-- AddForeignKey
ALTER TABLE "dailyLogs" ADD CONSTRAINT "dailyLogs_aiResultId_fkey" FOREIGN KEY ("aiResultId") REFERENCES "Ai_Result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_aiResultId_fkey" FOREIGN KEY ("aiResultId") REFERENCES "Ai_Result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_aiResultId_fkey" FOREIGN KEY ("aiResultId") REFERENCES "Ai_Result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

