# Creating a New Module

Step-by-step guide to add a new feature module to Kawan Nusa BE.

## Prerequisites

- Read `docs/architecture.md` first
- Understand the module pattern

## Step 1: Create Directory Structure

```bash
mkdir -p src/modules/invoice/{entities,interfaces,repositories,validators,serializers}
```

## Step 2: Create Entity

```typescript
// src/modules/invoice/entities/invoice.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "../../user/entities/user.entity"

@Entity("invoices")
export class Invoice {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "user_id" })
    userId!: number

    @Column()
    title!: string

    @Column({ type: "decimal", precision: 15, scale: 2 })
    amount!: number

    @Column({ default: "pending" })
    status!: string

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
```

## Step 3: Create Repository Interface

```typescript
// src/modules/invoice/interfaces/invoice.repository.interface.ts
import { Invoice } from "../entities/invoice.entity"

export interface IInvoiceRepository {
    findAll(userId: number, page: number, limit: number): Promise<{ data: Invoice[]; total: number }>
    findById(id: number, userId: number): Promise<Invoice | null>
    create(data: Partial<Invoice>): Promise<Invoice>
    update(id: number, data: Partial<Invoice>): Promise<Invoice>
    delete(id: number): Promise<void>
}
```

## Step 4: Create TypeORM Repository

```typescript
// src/modules/invoice/repositories/invoice.repository.ts
import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Invoice } from "../entities/invoice.entity"
import { IInvoiceRepository } from "../interfaces/invoice.repository.interface"

export class InvoiceRepository implements IInvoiceRepository {
    private readonly repository: Repository<Invoice>

    constructor() {
        this.repository = AppDataSource.getRepository(Invoice)
    }

    async findAll(userId: number, page: number, limit: number) {
        const [data, total] = await this.repository.findAndCount({
            where: { userId },
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: "DESC" },
        })
        return { data, total }
    }

    async findById(id: number, userId: number) {
        return await this.repository.findOne({ where: { id, userId } })
    }

    async create(data: Partial<Invoice>) {
        const entity = this.repository.create(data)
        return await this.repository.save(entity)
    }

    async update(id: number, data: Partial<Invoice>) {
        await this.repository.update(id, data)
        return await this.repository.findOneOrFail({ where: { id } })
    }

    async delete(id: number) {
        await this.repository.delete(id)
    }
}
```

## Step 5: Create Service

```typescript
// src/modules/invoice/invoice.service.ts
import { IInvoiceRepository } from "./interfaces/invoice.repository.interface"
import { NotFoundException } from "../../core/exceptions/base"
import { Invoice } from "./entities/invoice.entity"

export class InvoiceService {
    constructor(private readonly repository: IInvoiceRepository) {}

    async getAll(userId: number, page: number, limit: number) {
        return await this.repository.findAll(userId, page, limit)
    }

    async getById(id: number, userId: number) {
        const invoice = await this.repository.findById(id, userId)
        if (!invoice) throw new NotFoundException("Invoice not found")
        return invoice
    }

    async create(userId: number, data: Partial<Invoice>) {
        return await this.repository.create({ ...data, userId })
    }

    async update(id: number, userId: number, data: Partial<Invoice>) {
        await this.getById(id, userId)
        return await this.repository.update(id, data)
    }

    async delete(id: number, userId: number) {
        await this.getById(id, userId)
        await this.repository.delete(id)
    }
}
```

## Step 6: Create Validator

```typescript
// src/modules/invoice/validators/invoice.validator.ts
import { z } from "zod"

export const CreateInvoiceValidator = z.object({
    title: z.string().min(1, "Title is required"),
    amount: z.number().positive("Amount must be positive"),
})

export const UpdateInvoiceValidator = z.object({
    title: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    status: z.enum(["pending", "paid", "cancelled"]).optional(),
})

export type CreateInvoiceValidator = z.infer<typeof CreateInvoiceValidator>
export type UpdateInvoiceValidator = z.infer<typeof UpdateInvoiceValidator>
```

## Step 7: Create Serializer

```typescript
// src/modules/invoice/serializers/invoice.serialize.ts
import { Invoice } from "../entities/invoice.entity"

export class InvoiceSerializer {
    static single(invoice: Invoice) {
        return {
            id: invoice.id,
            title: invoice.title,
            amount: Number(invoice.amount),
            status: invoice.status,
            createdAt: invoice.createdAt,
        }
    }

    static collection(invoices: Invoice[]) {
        return invoices.map(this.single)
    }
}
```

## Step 8: Create Controller

```typescript
// src/modules/invoice/invoice.controller.ts
import { Context } from "hono"
import { InvoiceService } from "./invoice.service"
import { ApiResponse } from "../../core/helpers/response"
import { InvoiceSerializer } from "./serializers/invoice.serialize"

export class InvoiceController {
    constructor(private readonly service: InvoiceService) {}

    async index(c: Context) {
        const user = c.get("user")
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const { data, total } = await this.service.getAll(user.id, page, limit)
        return ApiResponse.paginate(c, InvoiceSerializer.collection(data), total, page, limit)
    }

    async show(c: Context) {
        const user = c.get("user")
        const id = Number(c.req.param("id"))
        const invoice = await this.service.getById(id, user.id)
        return ApiResponse.success(c, InvoiceSerializer.single(invoice))
    }

    async store(c: Context) {
        const user = c.get("user")
        const body = c.req.valid("json" as never)
        const invoice = await this.service.create(user.id, body)
        return ApiResponse.success(c, InvoiceSerializer.single(invoice), "Invoice created", 201)
    }

    async update(c: Context) {
        const user = c.get("user")
        const id = Number(c.req.param("id"))
        const body = c.req.valid("json" as never)
        const invoice = await this.service.update(id, user.id, body)
        return ApiResponse.success(c, InvoiceSerializer.single(invoice))
    }

    async destroy(c: Context) {
        const user = c.get("user")
        const id = Number(c.req.param("id"))
        await this.service.delete(id, user.id)
        return ApiResponse.success(c, null, "Invoice deleted")
    }
}
```

## Step 9: Create Module (DI Wiring)

```typescript
// src/modules/invoice/invoice.module.ts
import { InvoiceRepository } from "./repositories/invoice.repository"
import { InvoiceService } from "./invoice.service"
import { InvoiceController } from "./invoice.controller"

const repository = new InvoiceRepository()
const service = new InvoiceService(repository)
export const invoiceController = new InvoiceController(service)
```

## Step 10: Register Routes in `src/routes/api.ts`

```typescript
import { invoiceController } from "../modules/invoice/invoice.module"
import { CreateInvoiceValidator, UpdateInvoiceValidator } from "../modules/invoice/validators/invoice.validator"

routes.get("/invoice", authMiddleware, roleMiddleware('user'), (c) => invoiceController.index(c))
routes.get("/invoice/:id", authMiddleware, roleMiddleware('user'), (c) => invoiceController.show(c))
routes.post("/invoice", authMiddleware, roleMiddleware('user'), zValidator("json", CreateInvoiceValidator, validationHook), (c) => invoiceController.store(c))
routes.put("/invoice/:id", authMiddleware, roleMiddleware('user'), zValidator("json", UpdateInvoiceValidator, validationHook), (c) => invoiceController.update(c))
routes.delete("/invoice/:id", authMiddleware, roleMiddleware('user'), (c) => invoiceController.destroy(c))
```

## Step 11: Add Entity to DataSource

Add `Invoice` to entities array in `src/config/database.ts`.

## Step 12: Write Integration Test

See `docs/testing-guide.md` for template.

## Step 13: Update Swagger

See `docs/swagger-guide.md`.

## Checklist

- [ ] Entity with TypeORM decorators
- [ ] Repository interface
- [ ] TypeORM repository implements interface
- [ ] Service with constructor injection
- [ ] Zod validator
- [ ] Serializer
- [ ] Thin controller
- [ ] Module wires deps
- [ ] Routes in `api.ts`
- [ ] Entity in DataSource
- [ ] Integration tests
- [ ] Swagger updated
