# AI Agent Instructions — Kawan Nusa BE

You are working on **Kawan Nusa BE**, a Hono + Bun + TypeORM backend API.

## MUST READ FIRST

Before making any changes, read these docs:
- `docs/architecture.md` — Project structure, patterns, DI approach
- `docs/module-guide.md` — How to create new modules
- `docs/testing-guide.md` — How to write integration tests
- `docs/swagger-guide.md` — How to write API documentation
- `docs/api-reference.md` — All endpoints reference

## Code Conventions

### Module Structure (CRITICAL)

```
modules/<name>/
├── entities/<name>.entity.ts
├── interfaces/<name>.repository.interface.ts
├── repositories/typeorm-<name>.repository.ts
├── validators/<name>.validator.ts
├── serializers/<name>.serialize.ts
├── <name>.controller.ts
├── <name>.service.ts
├── <name>.module.ts
└── <name>.enum.ts (optional)
```

### Dependency Injection

- **Manual constructor injection** — NO container, NO tokens, NO decorators
- `*.module.ts` creates instances and exports `controller` + `service` (if cross-module)
- Cross-module imports: ONLY from `*.module.ts`

Example:
```typescript
// invoice.module.ts
const repository = new TypeOrmInvoiceRepository()
const service = new InvoiceService(repository)
export const invoiceController = new InvoiceController(service)
```

### Routes

- ALL routes in `src/routes/api.ts` — NOT in modules
- Middleware per route: `authMiddleware`, `roleMiddleware('user'|'admin')`, `apiKeyMiddleware`
- Validation: `zValidator("json", Schema, validationHook)`

### Response Format

```typescript
ApiResponse.success(c, data, "Message", 200)
ApiResponse.paginate(c, data, total, page, limit)
ApiResponse.error(c, "Error", 400)
```

### Exceptions

From `src/core/exceptions/base`:
- `NotFoundException("Not found")`
- `BadRequestException("Bad request")`
- `UnauthorizedException("Unauthorized")`
- `ForbiddenException("Forbidden")`

### Naming

| Thing | Convention | Example |
|-------|-----------|--------|
| Entity | PascalCase singular | `Reward` |
| Table | snake_case plural | `rewards` |
| Column (entity) | camelCase | `customerServiceId` |
| Column (DB) | snake_case | `customer_service_id` |
| Repository | `TypeOrm<Name>Repository` | `TypeOrmRewardRepository` |
| Interface | `I<Name>Repository` | `IRewardRepository` |
| Service | `<Name>Service` | `RewardService` |
| Controller | `<Name>Controller` | `RewardController` |
| Validator | `Create<Name>Validator` | `CreateRewardValidator` |
| Serializer | `<Name>Serializer` | `RewardSerializer` |
| Test file | `<kebab-case>.test.ts` | `reward.test.ts` |

### Controller Pattern

```typescript
async index(c: Context) {
    const user = c.get("user")
    const page = Number(c.req.query("page")) || 1
    const limit = Number(c.req.query("limit")) || 10
    const { data, total } = await this.service.getAll(user.id, page, limit)
    return ApiResponse.paginate(c, Serializer.collection(data), total, page, limit)
}
```

### Service Pattern

```typescript
export class RewardService {
    constructor(
        private readonly repository: IRewardRepository,
        private readonly unitOfWork: IUnitOfWork,
    ) {}

    async getById(id: number) {
        const item = await this.repository.findById(id)
        if (!item) throw new NotFoundException("Reward not found")
        return item
    }
}
```

## When Creating a New Module

1. Follow `docs/module-guide.md` step-by-step
2. Create ALL files: entity, interface, repository, service, controller, validator, serializer, module
3. Register routes in `src/routes/api.ts`
4. Write integration tests
5. Update `swagger.yaml`
6. Add entity to DataSource

## When Writing Tests

1. Follow `docs/testing-guide.md`
2. Use helpers from `tests/helpers/`
3. Test: happy path, pagination, filters, auth (401), role (403), validation (422), not found (404)
4. One test file per module
5. Run `bun test` to verify

## DO NOT

- ❌ Create a DI container, tokens, or decorator-based injection
- ❌ Put routes inside module files
- ❌ Import from another module's internal files
- ❌ Skip tests for new features
- ❌ Use `any` without justification
- ❌ Hardcode config values
- ❌ Skip error handling
