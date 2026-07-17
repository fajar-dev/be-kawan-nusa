# CLAUDE.md — Kawan Nusa BE

Guidance for Claude Code and other AI agents working on this repository.

## Overview

Backend API for **Kawan Nusa**, the referral partner portal of PT. Media Antar Nusa (Nusanet).
Built with **Hono + Bun + TypeORM + MySQL 8**. It manages referral partners (`user` role) and
internal employees (`admin` role): customer referrals, point rewards (FIFO with expiry),
point submissions from the NIS internal system, redemptions (cash/product/voucher), reward
catalogs, education content, RBAC role management, and statistics.

The frontend lives in the sibling repo **kawan-nusa** (Nuxt 4 SPA). Swagger UI: `GET /api/docs`.

## Commands

```bash
bun install                 # install deps
bun run dev                 # dev server with hot reload (PORT from .env, default 4000)
bun run build               # bundle to dist/index.js
bun run start               # run src/index.ts (production: pm2 start ecosystem.config.js)
bun run seed                # run SQL seeders from database/seeders/
bun test                    # ~290 integration tests (needs a MySQL database; see tests/setup.ts)
bun test tests/integration/role.test.ts   # single file

# Scheduled jobs (run standalone via cron — see src/jobs/index.ts for crontab examples)
bun run sync-users          # sync referral users from NIS DB (Reseller, PartnerType='referral')
bun run sync-customers      # sync services/customers/phones/customer-services from NIS DB
bun run sync-employees      # sync employees from Nusawork API
bun run expire-points       # expire rewards past expiredDate
bun run process-submissions # process pending job_queues (every 5 min; creates points)
bun run recurring-points    # daily: enqueue monthly recurring point submissions (with backfill)
```

Copy `.env.dist` → `.env`. Key env groups: app/JWT, MySQL (`DB_*`), NIS read-only MySQL
(`NIS_DB_*`), SMTP, Google OAuth, Nusawork (employee sync), NusaContact (WhatsApp OTP),
MinIO (object storage), `FEEDBACK_URL` (Google AppScript), `API_KEY` (server-to-server reward).

## Architecture

Read [docs/architecture.md](docs/architecture.md). Key points:

- **21 feature modules** in `src/modules/` (auth, profile, user, employee, role, customer,
  customer-service, service, service-promotion, point, point-submission, redemption, catalog,
  catalog-category, education-article, education-video, education-category, template, feedback,
  statistic, additional).
- **Manual constructor injection** — no DI container. Wiring happens in each `{module}.module.ts`
  (composition root) which exports the controller singleton.
- Module pattern: `entities/` → `interfaces/{name}.repository.interface.ts` →
  `repositories/typeorm-{name}.repository.ts` → `{name}.service.ts` → `{name}.controller.ts` →
  `validators/` (Zod) → `serializers/` → `{name}.module.ts`.
- **All routes centralized** in [src/routes/api.ts](src/routes/api.ts), mounted at `/api` by
  `src/app.ts` (which also sets CORS, request logger, Swagger, static `/public/*`, and the global
  error handler mapping exceptions/ZodError to `ApiResponse.error`).
- Two databases: app MySQL (`AppDataSource`, `src/config/database.ts` — entities must be
  registered there) and read-only NIS MySQL (`NisDataSource`, `src/config/nis-database.ts`).

### Auth & authorization middleware chain (order matters)

```
authMiddleware                      # verifies JWT (HS256); role claim decides lookup:
                                    #   'admin' → Employee (+role relation → permissions)
                                    #   'user'  → User; sets c.get('user'|'role'|'permissions')
roleMiddleware('admin'|'user',...)  # 403 if role not in list
permissionMiddleware(module, 'L'|'T'|'E'|'H')   # admin fine-grained RBAC (Lihat/Tambah/Edit/Hapus)
apiKeyMiddleware                    # x-api-key header (POST /point/reward server-to-server)
rateLimitMiddleware(n)              # n req/min per IP (register, otp, forgot-password); no-op when ENV=test
tokenAuthMiddleware                 # JWT via ?token= query (file-ish endpoints)
```

Admins are **Employees** (synced from Nusawork), not rows in `users`. Their permissions come
from their assigned `Role.permissions` (`Record<module, ('L'|'T'|'E'|'H')[]>`), managed via
`/role` endpoints and enforced per-route in `api.ts`.

### Domain logic to know before touching points/redemptions

- **`PointCalculator`** ([src/core/helpers/point.ts](src/core/helpers/point.ts)) — FIFO point
  engine: lazy-expires overdue rewards, deducts from soonest-expiring rewards first, all inside
  a TypeORM transaction (`EntityManager` passed in). Never manipulate `points.remainingPoint`
  outside it.
- **`calculateWithdrawal`** ([src/core/helpers/withdraw.ts](src/core/helpers/withdraw.ts)) —
  1 point = Rp 1.000, tax 2.5%, payout = gross − tax.
- **Point submissions** are async: approve writes rows to `job_queues`; the
  `process-submissions` job (cron) pulls NIS data and creates points, with retries (max 5) and
  failures logged to `job_queue_failures`. Recurring submissions get monthly queue entries from
  the `recurring-points` job (backfills missed months, clamps day-of-month).

## Key Files

- `src/app.ts` — Hono app factory (CORS, logger, error handler, Swagger)
- `src/routes/api.ts` — every route + its middleware chain (single source of truth)
- `src/config/config.ts` — all env config, centralized
- `src/config/database.ts` — AppDataSource + entity registry (34 entities)
- `src/config/nis-database.ts` — read-only NIS DataSource
- `src/core/helpers/response.ts` — `ApiResponse` formatter (use for every response)
- `src/core/exceptions/base.ts` — exception hierarchy (400/401/403/404/409/422/429)
- `src/core/helpers/` — minio (storage + `/api/proxy`), nis, nusawork, nusacontact (WA OTP),
  mail (SMTP + `public/templates/` HTML), pdf (receipts), point, withdraw, hash, logger
- `src/core/queue/` — `job_queues` / `job_queue_failures` entities + `QueueType`
- `swagger.yaml` — OpenAPI docs served at `/api/docs`

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/architecture.md](docs/architecture.md) | Architecture, layers, patterns, middleware |
| [docs/api-reference.md](docs/api-reference.md) | All endpoints with auth/role/permission |
| [docs/jobs-and-integrations.md](docs/jobs-and-integrations.md) | Cron jobs, queue, NIS/Nusawork/NusaContact/MinIO |
| [docs/module-guide.md](docs/module-guide.md) | Step-by-step new module creation |
| [docs/testing-guide.md](docs/testing-guide.md) | Writing integration tests |
| [docs/swagger-guide.md](docs/swagger-guide.md) | Updating swagger.yaml |

## New Feature Checklist

1. Entity (register in `src/config/database.ts`) → Interface → Repository → Service →
   Controller → Validator → Serializer → Module.
2. Route in `src/routes/api.ts` with the correct middleware chain (auth → role → permission).
3. New admin module? Add its permission key to the role permission matrix
   (`src/modules/role/`), and mirror it in the frontend (`useNavigation`/`usePermission`).
4. Integration tests in `tests/integration/<name>.test.ts` (use `tests/helpers/`).
5. Document in `swagger.yaml` and update `docs/api-reference.md`.

## Rules

- No DI container — manual constructor injection; services depend on `I*Repository` interfaces.
- Routes live in `api.ts` only, never inside modules.
- Cross-module imports only via `*.module.ts` exports (or shared `core/`).
- Always return through `ApiResponse`; always throw custom exceptions (never raw `Error` for
  expected failures) — the global handler formats them.
- Money/point mutations must run in a transaction via `PointCalculator`.
- Files/images go to **MinIO** (`core/helpers/minio.ts`), served through `/api/proxy?path=` —
  not to `public/uploads`.
- User-facing strings (emails, error messages shown in the app) are Indonesian.
- Database schema is managed by `DB_SYNC` (TypeORM synchronize) — there are **no migrations**;
  be careful with destructive entity changes against real data.
