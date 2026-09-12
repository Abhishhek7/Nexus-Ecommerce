# Database Design

## Core entities

`users → vendors → products → inventory`

`users → orders → order_items → products`

`orders → payments`

`categories → categories` (parent/child hierarchy)

`orders ↔ coupons` through `order_coupons`

## Important constraints

- `users.email` is unique.
- `products.sku` is unique.
- `vendors.user_id` is unique, enforcing one vendor profile per user.
- `inventory.product_id` is unique, enforcing one inventory row per product.
- `payments.order_id` is unique, enforcing one payment record per order.
- `order_coupons(order_id,coupon_id)` is a composite primary key.
- Foreign keys preserve relational integrity.

## Index strategy

Indexes target actual access patterns rather than every column:

- Users: role/status
- Vendors: status
- Categories: parent/status
- Products: vendor/status, category/status, status/price, name, unique SKU
- Orders: customer/createdAt, status/createdAt
- Order items: product/order and order
- Payments: status
- Coupons: code/status and status/date window

For large-scale search, ordinary `LIKE` matching on product text should be replaced or supplemented by MySQL full-text indexes or a search engine.

## Why inventory is separate

Inventory changes are high-frequency, concurrency-sensitive mutations. Separating it from product metadata keeps the stock row small and gives the model a natural extension point for reservations, warehouses and stock movements.

## Transactions

Order creation is atomic. Order, items, payment, inventory changes and coupon usage either all commit or all roll back.

## Historical pricing

`order_items.unit_price` is a snapshot of the price at checkout and is never read from the current product price when rendering historical orders.
