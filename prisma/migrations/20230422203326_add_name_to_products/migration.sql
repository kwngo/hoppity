/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "name" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");
