# Kawan Nusa BE — Architecture Guide

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Framework | Hono |
| ORM | TypeORM |
| Database | PostgreSQL |
| Validation | Zod |
| Auth | JWT (hono/jwt) |
| Storage | MinIO (S3-compatible) |
| Email | Nodemailer |
| Testing | Bun Test |
| Docs | Swagger/OpenAPI 3.0 |

## Project Structure

```
src/
├── config/           # App config, database connection
│   ├── config.ts     # Environment variables & app config
│   └── database.ts   # TypeORM DataSource (AppDataSource)
│
├── core/             # Shared infrastructure
│   ├── exceptions/   # Custom exception classes (BaseException, NotFoundException, etc.)
│   ├── helpers/      # Utilities (response, hash, mail, minio, point calculator, auth token, validator)
│   ├── interfaces/   # Shared interfaces (IUnitOfWork, IBaseRepository)
│   └── middlewares/  # Auth, role, API key middlewares
│
├── modules/          # Feature modules (20 total)
│   ├── auth/
│   ├── user/
│   ├── customer/
│   ├── reward/
│   └── ...
│
├── routes/
│   └── api.ts        # Centralized route definitions
│
├── jobs/             # Background jobs (cron)
├── app.ts            # Hono app factory (CORS, error handler, route mounting)
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
│   └── typeorm-reward.repository.ts
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
import { TypeOrmRewardRepository } from "./repositories/typeorm-reward.repository"
import { RewardService } from "./reward.service"
import { RewardController } from "./reward.controller"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { PointCalculator } from "../../core/helpers/point"

const repository = new TypeOrmRewardRepository()
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

- **authMiddleware**: Validates JWT from `Authorization: Bearer <token>`. Sets `c.get("user")` and `c.get("jwtPayload")`.
- **roleMiddleware('user')** / **roleMiddleware('admin')**: Checks role from JWT payload.
- **apiKeyMiddleware**: Validates `X-API-KEY` header for server-to-server calls.

## Error Handling

Custom exceptions extend `BaseException`:
- `NotFoundException` (404)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `ValidatorException` (422) — wraps ZodError
- `BadRequestException` (400)

Global error handler in `app.ts` catches all errors.
