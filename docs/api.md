# API Summary

Base path: `/api/v1`

## Auth
- `POST /auth/register`
- `POST /auth/login`

## Users
- `GET /users/me`
- `PATCH /users/me`

## Vendors
- `GET /vendors` — admin

## Categories
- `GET /categories`
- `POST /categories` — admin
- `PATCH /categories/:id` — admin
- `DELETE /categories/:id` — admin

## Products
- `GET /products`
- `GET /products/:id`
- `POST /products` — admin/vendor
- `PATCH /products/:id` — admin/owner vendor
- `DELETE /products/:id` — admin/owner vendor
- `PATCH /products/:id/inventory` — admin/owner vendor
- `GET /products/top-selling`

Product listing supports `search`, `vendorId`, `categoryId`, `categoryTree`, `minPrice`, `maxPrice`, `status`, `inStock`, `sortBy`, `sortOrder`, `page` and `limit`.

## Orders
- `POST /orders` — customer
- `GET /orders` — role-scoped
- `GET /orders/:id` — role-scoped
- `PATCH /orders/:id/status` — admin/vendor, with state-machine validation and vendor ownership
- `POST /orders/:id/cancel` — customer/admin for eligible states

## Reports
- `GET /reports/sales`
- `GET /vendors/me/dashboard`
- `GET /admin/dashboard`

Sales supports `day`, `week`, `month`, `vendor`, `category` and `product` grouping.

## Response contract

Success:

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": []
}
```

Paginated responses include:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "totalPages": 13
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Insufficient inventory",
  "code": "INSUFFICIENT_INVENTORY",
  "errors": []
}
```

Swagger UI is available at `/api/docs`.
