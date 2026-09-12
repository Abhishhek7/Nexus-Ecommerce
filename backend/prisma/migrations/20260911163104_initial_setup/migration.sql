/*
  Warnings:

  - You are about to drop the column `updated_at` on the `categories` table. All the data in the column will be lost.
  - You are about to alter the column `password_hash` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - Added the required column `updatedAt` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `categories` DROP FOREIGN KEY `fk_cat_parent`;

-- DropForeignKey
ALTER TABLE `inventory` DROP FOREIGN KEY `fk_inventory_product`;

-- DropForeignKey
ALTER TABLE `order_coupons` DROP FOREIGN KEY `fk_oc_coupon`;

-- DropForeignKey
ALTER TABLE `order_coupons` DROP FOREIGN KEY `fk_oc_order`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `fk_item_order`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `fk_item_product`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `fk_order_customer`;

-- DropForeignKey
ALTER TABLE `payments` DROP FOREIGN KEY `fk_payment_order`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `fk_product_category`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `fk_product_vendor`;

-- DropForeignKey
ALTER TABLE `vendors` DROP FOREIGN KEY `fk_vendor_user`;

-- DropIndex
DROP INDEX `fk_oc_coupon` ON `order_coupons`;

-- AlterTable
ALTER TABLE `categories` DROP COLUMN `updated_at`,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `coupons` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `inventory` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `orders` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `payments` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `products` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` MODIFY `password_hash` VARCHAR(191) NOT NULL,
    ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `vendors` ALTER COLUMN `updated_at` DROP DEFAULT;

-- CreateIndex
CREATE INDEX `coupons_code_status_idx` ON `coupons`(`code`, `status`);

-- AddForeignKey
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_coupons` ADD CONSTRAINT `order_coupons_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_coupons` ADD CONSTRAINT `order_coupons_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `categories` RENAME INDEX `idx_categories_parent_status` TO `categories_parent_id_status_idx`;

-- RenameIndex
ALTER TABLE `coupons` RENAME INDEX `code` TO `coupons_code_key`;

-- RenameIndex
ALTER TABLE `coupons` RENAME INDEX `idx_coupons_status_dates` TO `coupons_status_start_date_end_date_idx`;

-- RenameIndex
ALTER TABLE `inventory` RENAME INDEX `product_id` TO `inventory_product_id_key`;

-- RenameIndex
ALTER TABLE `order_items` RENAME INDEX `idx_items_order` TO `order_items_order_id_idx`;

-- RenameIndex
ALTER TABLE `order_items` RENAME INDEX `idx_items_product_order` TO `order_items_product_id_order_id_idx`;

-- RenameIndex
ALTER TABLE `orders` RENAME INDEX `idx_orders_customer_created` TO `orders_customer_id_created_at_idx`;

-- RenameIndex
ALTER TABLE `orders` RENAME INDEX `idx_orders_status_created` TO `orders_status_created_at_idx`;

-- RenameIndex
ALTER TABLE `orders` RENAME INDEX `order_number` TO `orders_order_number_key`;

-- RenameIndex
ALTER TABLE `payments` RENAME INDEX `idx_payments_status` TO `payments_status_idx`;

-- RenameIndex
ALTER TABLE `payments` RENAME INDEX `order_id` TO `payments_order_id_key`;

-- RenameIndex
ALTER TABLE `payments` RENAME INDEX `transaction_id` TO `payments_transaction_id_key`;

-- RenameIndex
ALTER TABLE `products` RENAME INDEX `idx_products_category_status` TO `products_category_id_status_idx`;

-- RenameIndex
ALTER TABLE `products` RENAME INDEX `idx_products_name` TO `products_name_idx`;

-- RenameIndex
ALTER TABLE `products` RENAME INDEX `idx_products_status_price` TO `products_status_price_idx`;

-- RenameIndex
ALTER TABLE `products` RENAME INDEX `idx_products_vendor_status` TO `products_vendor_id_status_idx`;

-- RenameIndex
ALTER TABLE `products` RENAME INDEX `sku` TO `products_sku_key`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `email` TO `users_email_key`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `idx_users_role_status` TO `users_role_status_idx`;

-- RenameIndex
ALTER TABLE `vendors` RENAME INDEX `idx_vendors_status` TO `vendors_status_idx`;

-- RenameIndex
ALTER TABLE `vendors` RENAME INDEX `user_id` TO `vendors_user_id_key`;
