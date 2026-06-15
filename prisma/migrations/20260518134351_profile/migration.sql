/*
  Warnings:

  - You are about to drop the column `image` on the `Profile` table. All the data in the column will be lost.
  - The `restdays` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `age` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficultLevel` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "image",
ADD COLUMN     "age" TEXT NOT NULL,
ADD COLUMN     "difficultLevel" TEXT NOT NULL,
ADD COLUMN     "height" TEXT NOT NULL,
ADD COLUMN     "weight" TEXT NOT NULL,
DROP COLUMN "restdays",
ADD COLUMN     "restdays" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT;
