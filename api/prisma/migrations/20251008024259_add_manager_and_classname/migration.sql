/*
  Warnings:

  - You are about to drop the column `schoolId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[managerId]` on the table `School` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_schoolId_fkey";

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "managerId" INTEGER;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "className" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "schoolId";

-- CreateIndex
CREATE UNIQUE INDEX "School_managerId_key" ON "School"("managerId");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
