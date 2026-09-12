# Order, Inventory & Sales Management Platform — Backend

## Stack
Node.js, TypeScript, Express 5, Prisma ORM, MySQL, JWT, Zod, Swagger/OpenAPI, Vitest/Supertest-ready test structure.

## Architecture
Request → middleware → controller → service → Prisma repository/data access → MySQL. Business rules live in services; validation is performed before controllers.

## Setup
1. Create MySQL database `order_inventory`.
2. Copy `.env.example` to `.env` and set credentials.
3. `npm install`
4. `npx prisma generate`
5. `npm run migrate -- --name init`
6. `npm run seed`
7. `npm run dev`

Swagger: `http://localhost:3000/api/docs`
Health: `http://localhost:3000/health`

Demo credentials: `admin@example.com`, `vendor1@example.com`, `customer1@example.com` — password `Password@123`.

## Transaction & concurrency
Order creation runs in a Prisma interactive transaction at `Serializable` isolation. Inventory is decremented using an atomic conditional `UPDATE ... WHERE available_quantity >= requested_quantity`. Therefore two concurrent requests cannot both consume the same stock. If the conditional update affects zero rows, an inventory conflict is raised and the transaction rolls back order, items, payment, coupon usage and inventory changes.

## Inventory separation
Inventory is separate from products so stock changes remain isolated from relatively static product metadata, concurrency-sensitive operations can lock/update a small row, and inventory can later be extended with warehouses, reservations or stock movements.

## Pricing
`order_items.unit_price` stores the purchase-time price; historical orders never depend on the current product price. Tax is 18%. Shipping is ₹100 below ₹2,000 and free at/above ₹2,000. `SAVE20` demonstrates percentage, minimum-order and maximum-discount rules.

## Authorization
Customers see their own orders. Vendors see orders containing their products and can manage only their own products. Admins have platform-wide access.

## Performance
Product listing uses bounded pagination, selective sorting, indexed foreign keys/status/price/SKU/name, and relation includes to avoid N+1 request patterns. Reporting/top-selling logic is structured around database filtering/aggregation primitives; for 10M+ products, add full-text/search infrastructure and cursor pagination where appropriate.

## Security
Passwords use bcrypt, JWT protects APIs, role authorization is enforced, Zod validates input, Helmet/CORS/rate limiting are enabled, secrets are environment variables, and error responses avoid leaking stack traces.

## Tests
`npm test` covers order transition/concurrency strategy examples. Expand with integration tests for auth, product CRUD, filters, pagination, authorization, coupons, stock conflicts, cancellation and reports as required by the assignment.
