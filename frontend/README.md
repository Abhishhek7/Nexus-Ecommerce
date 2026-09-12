# Nexus Commerce Dashboard

React + TypeScript management UI for the Nexus Commerce API.

## Routes

- `/login`
- `/dashboard`
- `/products`
- `/orders`
- `/orders/:id`

## Features

- JWT authentication
- Role-aware admin/vendor/customer experience
- Dashboard metrics and revenue chart
- Product search/filter/sort/pagination
- Product create/edit/deactivate
- Order search/status/date filters
- Order details and authorized status updates
- Loading, error and empty states

Set `VITE_API_URL` in `.env` when the API is not running at `http://localhost:3000/api/v1`.
