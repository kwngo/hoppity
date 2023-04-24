-- CreateTable
CREATE TABLE "product_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "product_likes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "product_likes" ADD CONSTRAINT "product_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_likes" ADD CONSTRAINT "product_likes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
