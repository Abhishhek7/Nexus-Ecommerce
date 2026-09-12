# Architecture

```text
React SPA
   ↓
REST API /api/v1
   ↓
Security + validation middleware
   ↓
Controllers
   ↓
Services
   ↓
Prisma ORM / parameterized SQL
   ↓
MySQL
```

## Request lifecycle

1. React sends an HTTP request through the Axios service layer.
2. Security middleware applies Helmet, CORS and rate limiting.
3. JWT middleware authenticates protected requests.
4. Role middleware checks ADMIN/VENDOR/CUSTOMER permissions.
5. Zod validates and normalizes body/query/path data.
6. Controllers translate HTTP input into service calls.
7. Services contain business rules and transaction boundaries.
8. Prisma performs relational queries/transactions.
9. The error middleware maps expected failures to stable API codes.

## Order lifecycle

Authenticate customer → validate order → load active products/inventory → calculate subtotal → validate coupon → calculate discount/tax/shipping → create order/items/payment → conditionally decrement inventory → conditionally increment coupon usage → commit.

A failure at any point rolls the complete transaction back.

## Concurrency lifecycle

The inventory update is conditional on the current quantity. The transaction also uses Serializable isolation. A competing transaction can therefore not make the final quantity negative. Prisma `P2034` transaction conflicts are surfaced as HTTP 409 so clients can retry.

## Authorization

- Customers can access only their own orders.
- Vendors can access only orders containing their products.
- Vendors can modify/delete only their own products and inventory.
- Admins can access platform-wide reporting and management operations.

## Error handling

Expected application errors use a status, stable code and optional validation errors. Database unique/not-found/serialization errors are translated to 409/404/409 respectively. Unexpected errors return a generic 500 response while the server logs diagnostic details.
