# Assignment Coverage Matrix

| Assignment area | Implementation |
|---|---|
| Node + TypeScript + REST | `backend/src` |
| MySQL + Prisma | `backend/prisma/schema.prisma` |
| JWT + RBAC | `backend/src/middlewares/auth.ts` |
| Validation | `backend/src/validators` + `middlewares/validate.ts` |
| Product CRUD/search | `services/product.service.ts` |
| Category hierarchy | `services/category.service.ts` |
| Transactional orders | `services/order.service.ts#createOrder` |
| Overselling prevention | Serializable transaction + conditional inventory update |
| Coupon rules/concurrency | Transactional coupon validation + conditional usage update |
| Order state machine | `services/order.service.ts#updateStatus` |
| Sales reporting | `services/report.service.ts#sales` |
| Vendor dashboard | `services/report.service.ts#vendorDashboard` |
| Admin dashboard | `services/report.service.ts#adminDashboard` |
| Pagination limits | Product/order validators and services |
| N+1 awareness | Relation loading + SQL aggregation |
| Security | Helmet, CORS, rate limit, bcrypt, JWT, Zod |
| Swagger/OpenAPI | `backend/src/docs/swagger.ts` |
| Seed data | `backend/prisma/seed.ts` |
| ER diagram | `ER-DIAGRAM.md` |
| Architecture/security/decisions | `docs/*.md` |
| Testing | `backend/tests` |
| React login | `frontend/src/pages/Login.tsx` |
| React dashboard | `frontend/src/pages/Dashboard.tsx` |
| React product management | `frontend/src/pages/Products.tsx` |
| React order management | `frontend/src/pages/Orders.tsx` |
| React order details | `frontend/src/pages/OrderDetails.tsx` |
