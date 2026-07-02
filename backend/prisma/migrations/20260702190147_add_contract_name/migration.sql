/*
  Warnings:

  - Added the required column `name` to the `contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "name" TEXT NOT NULL;
