# API contract

This contract is shared by `backend/`, `frontend/` and `mobile/`. If you change an endpoint, update this file and all three clients.

## Conventions

- Base path: `/api` (except `/health`). Default port: `8080`.
- Auth: `Authorization: Bearer <access_token>` on every `/api` route except `POST /api/auth/login`.
- Language: `Accept-Language: en | id`. Defaults to `en`. Error titles and messages are translated.
- Platform: `X-Platform: web | mobile` (optional, logged only).
- JSON keys are `snake_case`. Timestamps are RFC 3339 in UTC.

### Envelope

Every response uses the same envelope:

```json
{ "error": null, "message": "success", "data": {} }
```

On failure, `data` is `null` and `error` is set:

```json
{
  "error": { "error_code": "err_not_found", "title": "Not found", "message": "The data you are looking for does not exist." },
  "message": null,
  "data": null
}
```

### Pagination

List endpoints accept `page` (default 1), `limit` (default 20, max 100) and `search` (max 100 chars). Missing or `0` values fall back to the defaults; negative values, `limit > 100` or a longer `search` return 400 `bad_request`. `data` is:

```json
{ "data": [], "pagination": { "count": 42, "page": 1, "limit": 20 } }
```

`count` is the total number of matching rows, not the page size.

### Error codes

| HTTP | `error_code`              | When                                              |
| ---- | ------------------------- | ------------------------------------------------- |
| 400  | `bad_request`             | Malformed JSON or failed validation               |
| 401  | `err_invalid_credential`  | Wrong email or password                           |
| 401  | `err_unauthorized`        | Missing, invalid or expired token                 |
| 403  | `err_forbidden`           | Logged in, but the role lacks the permission      |
| 403  | `err_user_inactive`       | Account is disabled                               |
| 404  | `err_not_found`           | Resource (or route) does not exist, or was soft-deleted |
| 409  | `err_duplicate`           | Unique value already used (e.g. product SKU)      |
| 500  | `internal_server_error`   | Anything unexpected (details only in server logs) |
| 503  | `err_service_unavailable` | `GET /health` only: the database is unreachable   |

## Roles and permissions

The role → permission map lives only in the backend (`pkg/constantvar`). Clients read `permissions` from `/api/auth/me` and never hard-code roles.

| Role    | Permissions     |
| ------- | --------------- |
| `ADMIN` | `product.write` |
| `STAFF` | (read only)     |

Dev accounts (seeded by `db/init/02_seed_dev.sql`, password `Password123!`): `admin@example.com` (ADMIN), `staff@example.com` (STAFF).

## Endpoints

### `GET /health`

Not wrapped in `/api`, no auth. Returns 503 `err_service_unavailable` when the database is unreachable.

```json
{ "error": null, "message": "success", "data": { "status": "ok", "message": "pong", "current_date": "2026-10-04T03:00:00Z" } }
```

### `POST /api/auth/login`

Request:

```json
{ "email": "admin@example.com", "password": "Password123!" }
```

Response `data` (`LoginResponse`):

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_at": "2026-10-04T11:00:00Z",
  "user": {
    "id": 1,
    "full_name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN",
    "role_name": "Administrator",
    "last_login_at": "2026-10-04T03:00:00Z",
    "permissions": ["product.write"]
  }
}
```

### `GET /api/auth/me`

Response `data`: the `user` object above (`UserResponse`).

### `GET /api/dashboard`

Response `data`:

```json
{
  "total_products": 12,
  "active_products": 10,
  "inactive_products": 2,
  "low_stock_products": 3,
  "inventory_value": 54355000,
  "recent_products": [ /* up to 5 Product, newest first */ ]
}
```

- `low_stock_products`: active products with `stock <= 10` (`LOW_STOCK_THRESHOLD` in the backend).
- `inventory_value`: sum of `price * stock` over active products.

### Products

`Product`:

```json
{
  "id": 1,
  "sku": "PRD-0001",
  "name": "Wireless Mouse",
  "description": "2.4 GHz, silent click",
  "price": 99000,
  "stock": 25,
  "is_active": true,
  "created_at": "2026-10-04T03:00:00Z",
  "updated_at": null
}
```

`description` and `updated_at` may be `null`. `price` is a number with up to 2 decimals.

| Method   | Path                 | Permission      | Notes                                                                                          |
| -------- | -------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `GET`    | `/api/products`      | any logged-in   | Query: `page`, `limit`, `search` (matches SKU or name), `active_only=true`. Newest first.      |
| `GET`    | `/api/products/:id`  | any logged-in   | 404 if missing                                                                                 |
| `POST`   | `/api/products`      | `product.write` | Body: `ProductRequest`. Returns **201** with the created `Product`. 409 on duplicate SKU.       |
| `PUT`    | `/api/products/:id`  | `product.write` | Body: `ProductRequest`. Returns the updated `Product`.                                         |
| `DELETE` | `/api/products/:id`  | `product.write` | Soft delete. `data` is `null`.                                                                 |

`ProductRequest`:

```json
{ "sku": "PRD-0001", "name": "Wireless Mouse", "description": null, "price": 99000, "stock": 25, "is_active": true }
```

| Field         | Rules                                   |
| ------------- | --------------------------------------- |
| `sku`         | required, max 50, unique among non-deleted products |
| `name`        | required, max 200                       |
| `description` | optional, max 500                       |
| `price`       | required, `>= 0`, `<= 1000000000000`    |
| `stock`       | required, integer `>= 0`, `<= 2147483647` |
| `is_active`   | optional, defaults to `true` on create; omitted on update keeps the current value |

Strings are trimmed; a blank `description` is stored as `null`.

Every create, update and delete writes a row to `AuditLogs` in the same database transaction.
