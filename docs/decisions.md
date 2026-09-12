# Technical Decisions

1. **Prisma + MySQL** — MySQL is explicitly supported by the assignment and Prisma gives type-safe relational access.
2. **Service layer** — business rules and transaction boundaries stay outside HTTP controllers and are easier to test.
3. **Serializable transactions + conditional inventory updates** — protects the critical stock invariant under concurrent orders.
4. **Conditional coupon usage update** — prevents concurrent requests from exceeding a coupon usage limit.
5. **Separate inventory model** — keeps concurrency-sensitive stock mutations isolated and supports future reservations/warehouses.
6. **Purchase-time price snapshots** — historical orders remain correct after catalog price changes.
7. **Database-level aggregation** — top-selling and reporting are calculated in MySQL instead of loading entire datasets into Node.js.
8. **Offset pagination with a hard limit of 100** — simple for management dashboards and bounded against unreasonable requests; cursor pagination is appropriate for very large feeds.
9. **Soft deletion for products** — preserves foreign-key integrity and historical order references.
10. **Axios service layer in React** — centralizes the API base URL, JWT header and 401 handling.
11. **Role-aware dashboard** — the same route presents admin or vendor metrics while the API enforces the actual role.
12. **Mocked payment success for the assignment** — payment gateway integration is outside the supplied requirements; the data model is ready for a real provider.
