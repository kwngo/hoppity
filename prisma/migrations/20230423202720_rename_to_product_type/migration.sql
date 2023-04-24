/*
  Warnings:

  - Added the required column `producct_type` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "producct_type" VARCHAR(255) NOT NULL;
