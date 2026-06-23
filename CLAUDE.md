# CLAUDE.md — Kawan Nusa BE

Guidance for Claude Code and other AI agents.

## Overview

Backend API built with **Hono + Bun + TypeORM + PostgreSQL**. Loyalty/rewards platform with auth, customers, rewards, redemptions, catalogs, education, statistics.

## Architecture

Read `docs/architecture.md`. Key points:
- **20 feature modules** in `src/modules/`
- **Manual constructor injection** (no DI container)
- **Centralized routes** in `src/routes/api.ts`
- Module pattern: entity → interface → repository → service → controller → module

## Commands

```bash
bun run dev          # Dev server (port 8000)
bun test             # Run all 139 integration tests
bun test <file>      # Specific test file
```

## Key Files

- `src/app.ts` — Hono app factory
- `src/routes/api.ts` — All routes
- `src/config/config.ts` — Environment config
- `src/config/database.ts` — TypeORM DataSource
- `src/core/helpers/response.ts` — ApiResponse
- `src/core/exceptions/base.ts` — Exceptions
- `swagger.yaml` — OpenAPI docs

## Documentation

| Doc | Purpose |
|-----|---------|
| `docs/architecture.md` | Architecture & patterns |
| `docs/module-guide.md` | New module creation |
| `docs/testing-guide.md` | Writing tests |
| `docs/swagger-guide.md` | API documentation |
| `docs/api-reference.md` | All endpoints |

## New Module Checklist

1. Entity → Interface → Repository → Service → Controller → Validator → Serializer → Module
2. Routes in `src/routes/api.ts`
3. Tests in `tests/integration/<name>.test.ts`
4. Swagger in `swagger.yaml`

## Rules

- No DI container — manual constructor injection
- Routes in `api.ts`, not in modules
- Cross-module imports only from `*.module.ts`
- Always use `ApiResponse` for responses
- Always throw custom exceptions for errors
- Always write tests for new features
