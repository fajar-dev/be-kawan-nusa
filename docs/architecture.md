# Kawan Nusa BE — Architecture Guide

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Framework | Hono |
| ORM | TypeORM (`synchronize` via `DB_SYNC` — no migrations) |
| Database | MySQL 8 (app DB) + read-only NIS MySQL (sync source) |
| Validation | Zod + @hono/zod-validator |
| Auth | JWT HS256 (hono/jwt) + Google OAuth + OTP (email/WhatsApp) |
| Storage | MinIO (S3-compatible), proxied via `GET /api/proxy?path=` |
| Email | Nodemailer (HTML templates in `public/templates/`) |
| WhatsApp | NusaContact API (OTP delivery) |
| Employee sync | Nusawork API |
| PDF | PDFKit (receipts) |
| Testing | Bun Test (~290 integration tests) |
| Docs | Swagger/OpenAPI 3.0 (`/api/docs`) |
| Deploy | PM2 (`ecosystem.config.js`) / Docker Compose (app + MySQL) |

## Project Structure

```
src/
├── config/           # App config, database connections
│   ├── config.ts     # ALL environment variables, centralized
│   ├── database.ts   # AppDataSource (MySQL) + entity registry (35 entities)
│   ├── nis-database.ts # NisDataSource — read-only NIS MySQL (sync source)
│   └── smtp.ts       # Nodemailer transporter
│
├── core/             # Shared infrastructure
│   ├── exceptions/   # Custom exception classes (BaseException, NotFoundException, etc.)
│   ├── helpers/      # response, hash, mail, minio, nis, nusawork, nusacontact,
│   │                 # pdf, point (FIFO PointCalculator), withdraw, validator, logger
│   ├── interfaces/   # Shared interfaces (IUnitOfWork, IBaseRepository)
│   ├── middlewares/  # auth, role, permission, api-key, rate-limit, token-auth, logger
│   └── queue/        # JobQueue / JobQueueFailure entities + QueueType constants
│
├── modules/          # Feature modules (21 total)
│   ├── auth/  profile/  user/  employee/  role/
│   ├── customer/  customer-service/  service/  service-promotion/
│   ├── point/  point-submission/  redemption/
│   ├── catalog/  catalog-category/
│   ├── education-article/  education-video/  education-category/
│   └── template/  feedback/  statistic/  additional/
│
├── routes/
│   └── api.ts        # Centralized route definitions (single source of truth)
│
├── jobs/             # Standalone cron scripts (see docs/jobs-and-integrations.md):
│                     # sync-users, sync-customers, sync-employees,
│                     # expire-points, process-submissions, generate-monthly-submissions
├── database/seed.ts  # Runs SQL files from database/seeders/
├── app.ts            # Hono app factory (CORS, logger, error handler, Swagger, static)
└── index.ts          # Entry point (DB init, app start)

tests/
├── helpers/          # Test utilities
│   ├── test-client.ts    # HTTP request helper
│   └── auth.helper.ts    # Create test users, generate tokens
├── integration/      # Integration tests (1 file per module)
└── setup.ts          # Global test setup (DB connection)
```

## Module Pattern

Every module follows this structure:

```
modules/reward/
├── entities/             # TypeORM entities
│   └── reward.entity.ts
├── interfaces/           # Repository interface (abstraction)
│   └── reward.repository.interface.ts
├── repositories/         # TypeORM implementation
│   └── reward.repository.ts
├── validators/           # Zod validators
│   └── reward.validator.ts
├── serializers/          # Response serializers
│   └── reward.serialize.ts
├── reward.controller.ts  # HTTP handler (thin, delegates to service)
├── reward.service.ts     # Business logic
├── reward.module.ts      # Dependency wiring (creates instances)
└── reward.enum.ts        # Enums (optional)
```

### Layer Responsibilities

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| **Entity** | TypeORM database model | Only DB schema, no logic |
| **Interface** | Repository contract | Defines methods, used by service |
| **Repository** | Data access (TypeORM) | Implements interface, raw queries OK |
| **Service** | Business logic | No HTTP context, receives deps via constructor |
| **Controller** | HTTP handling | Parse request → call service → return response |
| **Validator** | Input validation | Zod schemas, exported as named constants |
| **Serializer** | Response shaping | Transform entity to API response format |
| **Module** | Dependency wiring | Create instances, export controller & service |

### Dependency Flow

```
Module → creates Repository → injects into Service → injects into Controller
         (+ UnitOfWork, PointCalculator if needed)
```

## Dependency Injection Pattern

We use **manual constructor injection** — no container, no decorators, no tokens.

Each `*.module.ts` file wires dependencies:

```typescript
// reward.module.ts
import { RewardRepository } from "./repositories/reward.repository"
import { RewardService } from "./reward.service"
import { RewardController } from "./reward.controller"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { PointCalculator } from "../../core/helpers/point"

const repository = new RewardRepository()
export const rewardService = new RewardService(repository, new TypeOrmUnitOfWork(), new PointCalculator())
export const rewardController = new RewardController(rewardService)
```

Rules:
- Export `controller` for route mounting in `api.ts`
- Export `service` only if used by other modules (cross-module dependency)
- Never import from another module's internal files — only from `*.module.ts`

## Route Pattern

Routes are centralized in `src/routes/api.ts`:

```typescript
import { rewardController } from "../modules/reward/reward.module"

routes.get("/reward", authMiddleware, roleMiddleware('user'), (c) => rewardController.index(c))
routes.post("/reward", apiKeyMiddleware, ..., (c) => rewardController.store(c))
```

Rules:
- All routes defined in `api.ts`, not in modules
- Routes grouped by resource
- Middleware applied per route
- Validators applied via `zValidator("json", Schema, validationHook)`

## API Response Format

All responses use `ApiResponse` helper:

```typescript
ApiResponse.success(c, data, "Message", 200)
ApiResponse.paginate(c, data, total, page, limit)
ApiResponse.error(c, "Error message", 400, context)
```

Response shape:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 50, "lastPage": 5 }
}
```

## Authentication & Authorization

Two account types share one JWT scheme (HS256, `role` claim decides the lookup):

- role `user` → row in `users` (referral partner; registers via email/Google/OTP)
- role `admin` → row in `employees` (synced from Nusawork; logs in via `/auth/admin/google`),
  with an assigned `Role` whose `permissions` is `Record<module, ('L'|'T'|'E'|'H')[]>`

Middleware chain (order matters — auth first):

- **authMiddleware**: Validates JWT from `Authorization: Bearer <token>`, loads the account
  (User or Employee+role), sets `c.get('user')`, `c.get('role')`, and for admins
  `c.get('permissions')`.
- **roleMiddleware(...roles)**: 403 unless `c.get('role')` is in the list.
- **permissionMiddleware(module, action)**: admin RBAC — 403 unless the employee's role grants
  the action (`L`ihat/view, `T`ambah/create, `E`dit, `H`apus/delete) on the module. Managed via
  `/role` endpoints (permission matrix lives in the role module).
- **apiKeyMiddleware**: Validates `x-api-key` header (server-to-server `POST /point/reward`).
- **rateLimitMiddleware(n)**: n requests/minute per IP (register, OTP, forgot-password);
  becomes a no-op when `ENV=test`.
- **tokenAuthMiddleware**: accepts JWT via `?token=` query param (for direct-link file access).

Access token: 15 min (`JWT_SECRET`); refresh token: 7 days (`JWT_REFRESH_SECRET`) via
`POST /auth/refresh`.

## Domain Invariants

- **Points are FIFO with expiry** — all balance reads/deductions go through `PointCalculator`
  (`core/helpers/point.ts`) inside a TypeORM transaction. It lazy-expires overdue rewards and
  deducts from the soonest-expiring rewards first. Never mutate `points.remainingPoint` directly.
- **Cash withdrawal math** (`core/helpers/withdraw.ts`): 1 point = Rp 1.000; tax 2,5%;
  payout = gross − tax.
- **Point submissions are processed asynchronously** through the `job_queues` table
  (approve → enqueue → `process-submissions` cron job creates points; failures go to
  `job_queue_failures`, max 5 retries). See docs/jobs-and-integrations.md.

## Error Handling

Custom exceptions extend `BaseException`:
- `NotFoundException` (404)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `ValidatorException` (422) — wraps ZodError
- `BadRequestException` (400)

Global error handler in `app.ts` catches all errors.

## Logging (Grafana Loki–ready)

`src/core/helpers/logger.ts` exposes a structured `logger` (`info`/`warn`/`error`)
that writes **single-line JSON (NDJSON)** — no ANSI colors, no multi-line records — to
**two sinks**:

1. **stdout** — captured by Docker / PM2 and shipped to Loki by Promtail (primary).
2. **`logs/app-YYYY-MM-DD.log`** — a daily-rotated on-disk history so logs survive
   even if the platform's stdout logs rotate away. Synchronous append (no line lost
   on job `process.exit`). The date is **UTC** (matches the `time` field). Disable with
   `LOG_TO_FILE=false`; it is also off automatically under `NODE_ENV=test`. Prune old
   `logs/app-*.log` via cron/logrotate if disk space is a concern (`logs/` is gitignored).

- `requestLogger` middleware logs one JSON line per request with `method`, `path`,
  `status`, `duration_ms`; level is derived from status (5xx=error, 4xx=warn, else info).
- `logError(err, ctx)` logs unhandled 500s with the stack kept as an escaped field
  (stays on one line); handled `BaseException`s are logged at `warn`.
- Shared fields on every entry: `time`, `level`, `service`, `env`, `msg`.

In Loki/LogQL, parse with `| json` and filter on the promoted labels, e.g.
`{service="kawan-nusa-be"} | json | status >= 500`.

### Domain events

Beyond request/error logs, these areas emit structured events (query with
`| json | event="…"` or `| json | job="…"`). **Secrets are never logged** — OTP codes,
verification/reset tokens, and passwords are omitted by design.

| Area | Events / fields |
|------|-----------------|
| Email (`core/helpers/mail.ts`, auth/user services) | `mail.sent` / `mail.failed` (`to`, `subject`, `kind`, `messageId`) |
| OTP (`auth.service.ts`, `core/helpers/nusacontact.ts`) | `otp.requested` / `otp.sent` / `otp.verified` / `otp.failed` (`userId`, `channel`) |
| Job queue (`jobs/process-submissions`, `jobs/generate-monthly-submissions`) | `job` field + `Job started/completed`, per-item `processed/failed/skipped` |
| Sync/expire cron (`jobs/sync-*`, `jobs/expire-points`) | structured start/complete/fail lines |
| Storage (`core/helpers/minio.ts`) | `source:"minio"` upload/delete/bucket events |
| NIS (`core/helpers/nis.ts`) | `source:"nis"` sync failures / skipped rows |
| PDF (`core/helpers/pdf.ts`) | `source:"pdf"` font fallback / missing data |
| Startup (`index.ts`) | `startup.db` connect / failure |

> Exception: `src/database/seed.ts` keeps plain `console.log` on purpose — it is a
> human-run one-off CLI script, not part of the Loki-scraped service output.
