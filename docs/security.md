# Security

- Passwords are hashed with bcrypt and never stored in plain text.
- JWT Bearer tokens authenticate protected APIs.
- Role-based authorization is enforced server-side.
- Vendor ownership is checked at the service layer, not trusted from client input.
- Zod validates request bodies, query strings and route parameters.
- Helmet provides basic security headers.
- CORS is configured from `CORS_ORIGIN`.
- Rate limiting protects the API from excessive requests.
- Prisma parameterized queries protect normal data access from SQL injection.
- Raw SQL used for reports/top-selling is built with Prisma SQL parameters; only a closed set of server-controlled grouping expressions is used.
- Secrets are loaded from environment variables.
- Production errors do not expose stack traces or database internals.
- Transaction conflicts and validation failures use explicit HTTP status codes.
