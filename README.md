# NEXUS Commerce — Full Stack Developer Assignment

A production-oriented multi-vendor Order, Inventory & Sales Management platform built against the supplied interviewer specification.

## What is implemented

### Backend — primary focus
- Node.js + TypeScript + Express 5
- Prisma ORM + **MySQL**
- JWT authentication and role-based authorization
- Admin / Vendor / Customer access control
- Vendor resource ownership enforcement
- Product CRUD with search, filters, category-tree filtering, sorting and bounded pagination
- Parent/child category hierarchy
- Transactional order creation
- Coupon validation, minimum order and maximum discount rules
- 18% tax and ₹100 shipping below ₹2,000; free shipping at/above ₹2,000
- Purchase-time `unitPrice` snapshots on order items
- Atomic inventory decrement and `Serializable` transactions to prevent overselling
- Coupon usage protected against concurrent updates
- Valid order-state transitions and cancellation rules
- Database-level top-selling aggregation
- Sales reports grouped by day/week/month/vendor/category/product
- Vendor and admin dashboard analytics
- Standard `{success,message,data}` success responses and structured errors
- Zod validation for request bodies, params and query strings
- Helmet, CORS, rate limiting, environment-based secrets and sanitized errors
- Application request/error logging
- Swagger/OpenAPI at `/api/docs`
- ER diagram and architecture/security/decision documentation
- Seed data: 1 admin, 2 vendors, 5 customers, 10 categories, 30 products, inventory, 20 orders, coupons and payments
- Unit tests plus an integration test for concurrent ordering

### Frontend
- React + TypeScript + React Router
- JWT login/logout and protected routes
- Admin and vendor dashboards
- Revenue chart and top-product/category/vendor views
- Product search, filters, sorting and pagination
- Product create/edit/deactivate
- Order list with search/status/date filters
- Order details and authorized status transitions
- Loading, error and empty states
- Central Axios service layer

## Architecture

```text
React
  ↓
REST API /api/v1
  ↓
Middleware
  ├── JWT authentication
  ├── Role authorization
  ├── Zod validation
  └── Security headers / CORS / rate limiting
  ↓
Controllers
  ↓
Services
  ↓
Prisma
  ↓
MySQL
```

Controllers are intentionally thin. Business rules and transaction boundaries live in services.

## Run locally

### 1. Database

Create a MySQL database named `order_inventory`.

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env
npx prisma generate
npm run migrate:deploy
npm run seed
npm run dev
```

For macOS/Linux, use `cp .env.example .env`.

Backend runs on `http://localhost:3000`.

Swagger:
`http://localhost:3000/api/docs`

Health:
`http://localhost:3000/health`

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs on the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Demo accounts

All demo accounts use:

`Password@123`

- Admin: `admin@example.com`
- Vendor: `vendor1@example.com`
- Vendor: `vendor2@example.com`
- Customer: `customer1@example.com`

## Important technical decisions

### Inventory concurrency
Order creation is one database transaction at `Serializable` isolation. Stock is finally changed with a conditional atomic update:

```text
UPDATE inventory
SET available_quantity = available_quantity - ?
WHERE product_id = ?
  AND available_quantity >= ?
```

If another transaction consumes the stock first, the update affects zero rows and the order transaction is rolled back. Prisma serialization/deadlock conflicts are converted to HTTP `409`.

The integration test sends quantities 4 and 3 against stock 5 and verifies exactly one request succeeds and final stock is 1.

### Coupon concurrency
Coupon usage is also incremented conditionally:

```text
used_count < usage_limit
```

If the limit is consumed by another transaction, the order is rolled back instead of allowing usage-limit overflow.

### Historical pricing
`order_items.unit_price` stores the price at checkout. Historical orders therefore do not change when the product's current price changes.

### Separate inventory table
Inventory is separated from product metadata because stock is mutated frequently and is concurrency-sensitive. It also leaves room for reservations, warehouses and stock-movement history.

### N+1 prevention
Normal product/order APIs load related records through Prisma relations. Top-selling and reporting use database joins and aggregation rather than loading all orders into application memory.

### Large datasets
For 10M+ products, the next step would be MySQL full-text/search infrastructure or a dedicated search engine, composite indexes based on measured query plans, and cursor pagination for high-volume feeds.

## Testing

```bash
cd backend
npm test
```

The suite includes:
- Order state-transition rules
- Tax/shipping rules
- Invalid authentication
- Health endpoint
- Concurrent order requests and overselling protection when a MySQL `DATABASE_URL` is available

The integration suite is intentionally skipped when no database is configured so a reviewer can still run the unit suite independently.

## Documentation

- `ER-DIAGRAM.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/api.md`
- `docs/security.md`
- `docs/decisions.md`
- `docs/Nexus-Commerce.postman_collection.json`

## Submission notes

No `.env`, credentials or `node_modules` are included in the submission.
