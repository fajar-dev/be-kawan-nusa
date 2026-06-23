# Kawan Nusa — Referral Portal Backend

API Backend untuk **Kawan Nusa Referral Portal**, dibangun dengan **Hono**, **Bun**, dan **TypeORM**.  
Sistem ini mengelola referral pelanggan, manajemen poin, redemption reward, dan konten edukasi.

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Arsitektur](#arsitektur)
- [Struktur Proyek](#struktur-proyek)
- [Memulai](#memulai)
- [Konfigurasi Environment](#konfigurasi-environment)
- [API Endpoints](#api-endpoints)
- [Konvensi Kode](#konvensi-kode)
- [Menambah Module Baru](#menambah-module-baru)
- [Dokumentasi Lengkap](#dokumentasi-lengkap)

---

## Tech Stack

| Kategori       | Library / Tool                     |
| -------------- | ---------------------------------- |
| Runtime        | [Bun](https://bun.sh)              |
| Framework      | [Hono](https://hono.dev)           |
| Database       | MySQL 8+                           |
| ORM            | TypeORM                            |
| Validasi       | Zod + @hono/zod-validator          |
| Auth           | JWT (HS256) via `hono/jwt`         |
| Email          | Nodemailer (SMTP)                  |
| PDF            | PDFKit                             |
| Proses Manager | PM2                                |

---

## Arsitektur

Proyek ini menggunakan **Clean Architecture** dengan prinsip **SOLID**, **Dependency Injection**, dan **Repository Pattern**.

### Lapisan (Layer)

```
┌──────────────────────────────────────┐
│           Presentation Layer          │
│   Controller → HTTP req/res handler  │
├──────────────────────────────────────┤
│           Application Layer          │
│   Service → Bisnis logik & use case  │
├──────────────────────────────────────┤
│             Domain Layer             │
│   Repository Interface → Kontrak     │
├──────────────────────────────────────┤
│         Infrastructure Layer         │
│   TypeORM Repository → Akses data    │
└──────────────────────────────────────┘
```

### Alur Dependency

```
routes/api.ts
    │
    └─ {module}.module.ts          ← Composition Root (wiring DI)
           ├─ Repository (TypeORM) ← implements Interface
           ├─ Service              ← menerima Interface via constructor
           └─ Controller           ← menerima Service via constructor
```

### Prinsip SOLID yang Diterapkan

| Prinsip | Penerapan |
| ------- | --------- |
| **S** — Single Responsibility | Controller hanya handle HTTP, Service hanya bisnis logik, Repository hanya akses data |
| **O** — Open/Closed | Implementasi repository bisa diganti tanpa ubah service |
| **L** — Liskov Substitution | `TypeOrmXxxRepository` dapat disubstitusi dengan implementasi lain yang memenuhi `IXxxRepository` |
| **I** — Interface Segregation | Setiap module punya interface spesifik sesuai kebutuhannya |
| **D** — Dependency Inversion | Service bergantung pada `IXxxRepository` (abstraksi), bukan `TypeOrmXxxRepository` (konkret) |

---

## Struktur Proyek

```
kawan-nusa-be/
├── src/
│   ├── config/                        # Konfigurasi aplikasi
│   │   ├── config.ts                  # Env variables (app, db, mail)
│   │   ├── database.ts                # TypeORM DataSource
│   │   └── smtp.ts                    # Nodemailer transporter
│   │
│   ├── core/                          # Infrastruktur bersama
│   │   ├── exceptions/
│   │   │   └── base.ts                # Hierarki custom exception
│   │   ├── helpers/
│   │   │   ├── hash.ts                # bcrypt password hashing
│   │   │   ├── mail.ts                # Wrapper Nodemailer
│   │   │   ├── pdf.ts                 # Generate PDF receipt
│   │   │   ├── point.ts               # FIFO point logic
│   │   │   ├── response.ts            # ApiResponse formatter
│   │   │   ├── validator.ts           # Zod validation hook
│   │   │   └── withdraw.ts            # Kalkulasi withdrawal
│   │   ├── interfaces/
│   │   │   └── base.repository.interface.ts
│   │   └── middlewares/
│   │       ├── auth.middleware.ts     # JWT auth
│   │       ├── api-key.middleware.ts  # API key auth
│   │       └── token-auth.middleware.ts
│   │
│   ├── modules/                       # Feature modules
│   │   └── {module}/
│   │       ├── {module}.module.ts     # Composition root (DI wiring)
│   │       ├── {module}.controller.ts # HTTP handler
│   │       ├── {module}.service.ts    # Bisnis logik
│   │       ├── entities/              # TypeORM entities
│   │       ├── interfaces/
│   │       │   └── {module}.repository.interface.ts
│   │       ├── repositories/
│   │       │   └── typeorm-{module}.repository.ts
│   │       ├── serializers/           # Response DTO transformer
│   │       └── validators/            # Zod schema
│   │
│   ├── routes/
│   │   └── api.ts                     # Definisi route (import dari module)
│   │
│   ├── database/
│   │   ├── seed.ts                    # Script seeder
│   │   └── seeders/                   # File SQL seed
│   │
│   └── index.ts                       # Entry point aplikasi
│
├── public/
│   ├── uploads/                       # File upload (profile, feedback)
│   └── templates/                     # Template HTML email
│
├── .env                               # Konfigurasi environment (tidak di-commit)
├── .env.dist                          # Template environment
├── ecosystem.config.js                # Konfigurasi PM2
└── package.json
```

### Module yang Tersedia

| Module               | Deskripsi                                          |
| -------------------- | -------------------------------------------------- |
| `auth`               | Register, login, refresh token, reset password     |
| `profile`            | Update data akun, bank, preferensi, foto           |
| `customer`           | Daftar dan detail pelanggan                        |
| `customer-service`   | Langganan layanan pelanggan                        |
| `reward`             | Pemberian poin reward                              |
| `redemption`         | Penukaran poin (cash, voucher, produk)             |
| `point`              | Saldo poin & cleanup expired                       |
| `statistic`          | Dashboard statistik (count, chart)                 |
| `catalog`            | Katalog item redemption                            |
| `catalog-category`   | Kategori katalog                                   |
| `education-article`  | Artikel edukasi + tracking view                    |
| `education-video`    | Video edukasi + tracking view                      |
| `education-category` | Kategori konten edukasi                            |
| `service`            | Data layanan internet                              |
| `service-promotion`  | Promosi layanan                                    |
| `feedback`           | Feedback pengguna (upload + Google AppScript)      |
| `template`           | Template dokumen                                   |
| `additional`         | Enum helpers & global search                       |

---

## Memulai

### Prasyarat

- [Bun](https://bun.sh) >= 1.0
- MySQL >= 8.0
- SMTP server (untuk fitur email)

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### Instalasi

```bash
# 1. Clone repository
git clone <repository-url>
cd kawan-nusa-be

# 2. Install dependencies
bun install

# 3. Salin dan isi environment file
cp .env.dist .env
```

Edit `.env` sesuai konfigurasi lokal Anda (lihat [Konfigurasi Environment](#konfigurasi-environment)).

### Menjalankan Aplikasi

```bash
# Development (hot-reload)
bun run dev

# Production
bun run build
bun run start

# Seed database
bun run seed
```

Server berjalan di `http://localhost:4000` (sesuai nilai `PORT` di `.env`).

### PM2 (Production Process Manager)

```bash
pm2 start ecosystem.config.js
pm2 logs kawan-nusa-be
pm2 restart kawan-nusa-be
```

---

## Konfigurasi Environment

Salin `.env.dist` menjadi `.env` lalu isi setiap nilai:

```env
# Application
PORT=4000
ENV=development
APP_URL=http://localhost:4000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=kawan_nusa
DB_SYNC=true

# JWT
JWT_SECRET=supersecretkey
JWT_REFRESH_SECRET=superrefreshsecretkey
API_KEY=your-api-key

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=noreply@example.com

# Integrasi
FEEDBACK_URL=https://script.google.com/...
```

| Variable             | Deskripsi                                   | Default                 |
| -------------------- | ------------------------------------------- | ----------------------- |
| `PORT`               | Port server                                 | `4000`                  |
| `ENV`                | Environment (`development` / `production`)  | `development`           |
| `APP_URL`            | Base URL publik server                      | `http://localhost:4000` |
| `DB_HOST`            | Host database MySQL                         | `localhost`             |
| `DB_PORT`            | Port database                               | `3306`                  |
| `DB_USER`            | Username database                           | `root`                  |
| `DB_PASS`            | Password database                           | —                       |
| `DB_NAME`            | Nama database                               | `kawan_nusa`            |
| `DB_SYNC`            | Auto-sync schema TypeORM                    | `true`                  |
| `JWT_SECRET`         | Secret untuk access token (15 menit)        | —                       |
| `JWT_REFRESH_SECRET` | Secret untuk refresh token (7 hari)         | —                       |
| `API_KEY`            | Kunci untuk endpoint reward (server-to-server) | —                    |
| `SMTP_HOST`          | Host SMTP                                   | —                       |
| `SMTP_PORT`          | Port SMTP                                   | —                       |
| `SMTP_USER`          | Username SMTP                               | —                       |
| `SMTP_PASS`          | Password SMTP                               | —                       |
| `SMTP_FROM`          | Alamat email pengirim                       | —                       |
| `FEEDBACK_URL`       | URL Google AppScript untuk feedback         | —                       |

> **Catatan:** Jangan commit file `.env` ke repository. Pastikan sudah masuk `.gitignore`.

---

## API Endpoints

Base URL: `/api`  
Dokumentasi interaktif tersedia di: `GET /api/docs` (Swagger UI)

### Autentikasi

| Method | Endpoint                       | Auth     | Deskripsi                   |
| ------ | ------------------------------ | -------- | --------------------------- |
| POST   | `/auth/register`               | —        | Registrasi akun baru        |
| POST   | `/auth/login`                  | —        | Login, returns JWT tokens   |
| POST   | `/auth/refresh`                | —        | Refresh access token        |
| POST   | `/auth/forgot-password`        | —        | Kirim email reset password  |
| GET    | `/auth/validate-reset-token`   | —        | Validasi reset token        |
| POST   | `/auth/reset-password`         | —        | Reset password baru         |
| GET    | `/auth/me`                     | Bearer   | Data user yang sedang login |
| POST   | `/auth/logout`                 | Bearer   | Logout                      |

### Profil

| Method | Endpoint                | Auth   | Deskripsi                  |
| ------ | ----------------------- | ------ | -------------------------- |
| GET    | `/profile`              | Bearer | Lihat profil                |
| PUT    | `/profile/account`      | Bearer | Update data akun            |
| PUT    | `/profile/bank`         | Bearer | Update info rekening bank   |
| PUT    | `/profile/preference`   | Bearer | Update preferensi           |
| PUT    | `/profile/password`     | Bearer | Ganti password              |
| POST   | `/profile/photo`        | Bearer | Upload foto profil          |

### Poin & Reward

| Method | Endpoint                        | Auth    | Deskripsi                    |
| ------ | ------------------------------- | ------- | ---------------------------- |
| GET    | `/point`                        | Bearer  | Saldo poin tersedia          |
| GET    | `/reward`                       | Bearer  | Riwayat reward               |
| POST   | `/reward`                       | API Key | Tambah reward (server-to-server) |
| GET    | `/customer/:id/reward`          | Bearer  | Reward per pelanggan         |

### Redemption

| Method | Endpoint                            | Auth    | Deskripsi                    |
| ------ | ----------------------------------- | ------- | ---------------------------- |
| GET    | `/redemption`                       | Bearer  | Riwayat redemption           |
| GET    | `/redemption/:id`                   | Bearer  | Detail redemption            |
| POST   | `/redemption/cash`                  | Bearer  | Tukar poin ke cash           |
| POST   | `/redemption/voucher`               | Bearer  | Tukar poin ke voucher        |
| POST   | `/redemption/product`               | Bearer  | Tukar poin ke produk         |
| GET    | `/redemption/:id/receipt`           | Token   | Preview receipt PDF          |
| GET    | `/redemption/:id/receipt/download`  | Token   | Download receipt PDF         |

### Pelanggan & Layanan

| Method | Endpoint                    | Auth   | Deskripsi                        |
| ------ | --------------------------- | ------ | -------------------------------- |
| GET    | `/customer`                 | Bearer | Daftar pelanggan (paginated)     |
| GET    | `/customer/:id`             | Bearer | Detail pelanggan                 |
| GET    | `/customer/:id/service`     | Bearer | Layanan per pelanggan            |
| GET    | `/service`                  | Bearer | Daftar layanan                   |
| GET    | `/service/:code`            | Bearer | Detail layanan                   |
| GET    | `/service/:code/customer`   | Bearer | Pelanggan per layanan            |
| GET    | `/service/promotion`        | Bearer | Daftar promosi layanan           |
| GET    | `/customer-service`         | Bearer | Semua langganan layanan          |

### Statistik

| Method | Endpoint                         | Auth   | Deskripsi                          |
| ------ | -------------------------------- | ------ | ---------------------------------- |
| GET    | `/statistic/count`               | Bearer | Ringkasan count (customer, poin)   |
| GET    | `/statistic/point`               | Bearer | Grafik poin per bulan              |
| GET    | `/statistic/customer`            | Bearer | Grafik customer (monthly/yearly)   |
| GET    | `/statistic/redemption-reward`   | Bearer | Statistik status redemption        |

### Katalog & Edukasi

| Method | Endpoint                      | Auth   | Deskripsi                   |
| ------ | ----------------------------- | ------ | --------------------------- |
| GET    | `/catalog`                    | Bearer | Daftar katalog              |
| GET    | `/catalog/:id`                | Bearer | Detail katalog              |
| GET    | `/catalog/category`           | Bearer | Kategori katalog            |
| GET    | `/education/article`          | Bearer | Daftar artikel edukasi      |
| GET    | `/education/article/:id`      | Bearer | Detail artikel              |
| GET    | `/education/video`            | Bearer | Daftar video edukasi        |
| GET    | `/education/video/:id`        | Bearer | Detail video                |
| GET    | `/education/category`         | Bearer | Kategori edukasi            |

### Lainnya

| Method | Endpoint                               | Auth   | Deskripsi                       |
| ------ | -------------------------------------- | ------ | ------------------------------- |
| GET    | `/feedback`                            | Bearer | Riwayat feedback user           |
| POST   | `/feedback`                            | Bearer | Kirim feedback (multipart)      |
| GET    | `/template`                            | Bearer | Daftar template dokumen         |
| GET    | `/template/:id`                        | Bearer | Detail template                 |
| GET    | `/template/:id/download`               | Bearer | Download template               |
| GET    | `/additional/service`                  | Bearer | Daftar semua layanan (enum)     |
| GET    | `/additional/customer-type`            | Bearer | Tipe pelanggan (enum)           |
| GET    | `/additional/customer-service-status`  | Bearer | Status langganan (enum)         |
| GET    | `/additional/reward-point-type`        | Bearer | Tipe poin reward (enum)         |
| GET    | `/additional/service-category`         | Bearer | Kategori layanan (enum)         |
| GET    | `/additional/search`                   | Bearer | Global search                   |

### Format Response

**Sukses (single data):**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": { ... }
}
```

**Sukses (paginated):**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }
}
```

### Autentikasi Request

```http
Authorization: Bearer <access_token>
```

Untuk endpoint reward (server-to-server):
```http
x-api-key: <api_key>
```

---

## Konvensi Kode

### Struktur Tiap Module

```
modules/{nama-module}/
├── {nama}.module.ts             # Wiring DI (komposisi)
├── {nama}.controller.ts         # Handle HTTP request/response
├── {nama}.service.ts            # Bisnis logik
├── entities/
│   └── {nama}.entity.ts         # TypeORM entity
├── interfaces/
│   └── {nama}.repository.interface.ts  # Kontrak repository
├── repositories/
│   └── typeorm-{nama}.repository.ts    # Implementasi TypeORM
├── serializers/
│   └── {nama}.serialize.ts      # Transform entity → response DTO
└── validators/
    └── {nama}.validator.ts      # Zod schema validasi
```

### Dependency Injection

Semua dependency diinjeksikan melalui **constructor**, bukan dibuat langsung di dalam class.

```typescript
// ✅ Benar — menerima abstraksi via constructor
export class RewardService {
    constructor(private readonly repository: IRewardRepository) {}
}

// ❌ Salah — membuat dependency sendiri (tight coupling)
export class RewardService {
    constructor() {
        this.repository = AppDataSource.getRepository(Reward) // langsung ke TypeORM
    }
}
```

Wiring dilakukan di file `.module.ts`:

```typescript
// reward.module.ts
const rewardRepository = new TypeOrmRewardRepository()
const rewardService    = new RewardService(rewardRepository)

export const rewardController = new RewardController(rewardService)
```

### Repository Interface

Setiap module mendefinisikan interface repository sendiri di folder `interfaces/`:

```typescript
// interfaces/reward.repository.interface.ts
export interface IRewardRepository {
    findAllByUserId(userId: number, ...): Promise<{ data: Reward[]; total: number }>
    save(data: Partial<Reward>, manager?: EntityManager): Promise<Reward>
}
```

Implementasi TypeORM di folder `repositories/`:

```typescript
// repositories/typeorm-reward.repository.ts
export class TypeOrmRewardRepository implements IRewardRepository {
    // implementasi menggunakan TypeORM
}
```

### Serializer (Response DTO)

Gunakan serializer untuk mengubah entity menjadi response object:

```typescript
export class RewardSerializer {
    static single(reward: Reward) {
        return { id: reward.id, point: reward.point, ... }
    }
    static collection(rewards: Reward[]) {
        return rewards.map(this.single)
    }
}
```

### Validasi Request

Gunakan Zod schema dan `zValidator` dari Hono:

```typescript
// validators/reward.validator.ts
export const CreateRewardValidator = z.object({
    customerServiceId: z.number(),
    point: z.number().positive(),
})
export type CreateRewardValidator = z.infer<typeof CreateRewardValidator>
```

### Exception Handling

Gunakan custom exception dari `core/exceptions/base.ts`:

```typescript
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"

// Di dalam service
if (!item) throw new NotFoundException("Item not found")
if (balance < required) throw new BadRequestException("Insufficient balance")
```

| Exception                   | Status Code |
| --------------------------- | ----------- |
| `BadRequestException`       | 400         |
| `UnauthorizedException`     | 401         |
| `ForbiddenException`        | 403         |
| `NotFoundException`         | 404         |
| `ConflictException`         | 409         |
| `ValidatorException`        | 422         |
| `TooManyValidatorsException`| 429         |

### Naming Convention

| Elemen         | Konvensi         | Contoh                         |
| -------------- | ---------------- | ------------------------------ |
| File           | kebab-case       | `reward.service.ts`            |
| Class          | PascalCase       | `RewardService`                |
| Method/Variable| camelCase        | `getByUserId`, `rewardService` |
| Interface      | PascalCase + `I` | `IRewardRepository`            |
| Enum           | PascalCase       | `RewardPointType`              |
| Konstanta      | UPPER_SNAKE_CASE | `MONTH_NAMES`                  |

---

## Menambah Module Baru

Ikuti langkah berikut untuk menambah module baru (contoh: `invoice`):

**1. Buat folder dan file-file module:**

```bash
mkdir -p src/modules/invoice/{entities,interfaces,repositories,serializers,validators}
```

**2. Buat entity TypeORM** (`entities/invoice.entity.ts`)

**3. Buat repository interface** (`interfaces/invoice.repository.interface.ts`):

```typescript
export interface IInvoiceRepository {
    findAll(...): Promise<{ data: Invoice[]; total: number }>
    findById(id: number): Promise<Invoice | null>
    save(data: Partial<Invoice>): Promise<Invoice>
}
```

**4. Buat TypeORM repository** (`repositories/typeorm-invoice.repository.ts`):

```typescript
export class TypeOrmInvoiceRepository implements IInvoiceRepository {
    private readonly repository: Repository<Invoice>
    constructor() {
        this.repository = AppDataSource.getRepository(Invoice)
    }
    // implementasi method interface
}
```

**5. Buat service** (`invoice.service.ts`):

```typescript
export class InvoiceService {
    constructor(private readonly repository: IInvoiceRepository) {}
    // bisnis logik
}
```

**6. Buat controller** (`invoice.controller.ts`):

```typescript
export class InvoiceController {
    constructor(private readonly service: InvoiceService) {}
    // handler HTTP
}
```

**7. Buat module** (`invoice.module.ts`):

```typescript
import { TypeOrmInvoiceRepository } from "./repositories/typeorm-invoice.repository"
import { InvoiceService }           from "./invoice.service"
import { InvoiceController }        from "./invoice.controller"

const invoiceRepository = new TypeOrmInvoiceRepository()
const invoiceService    = new InvoiceService(invoiceRepository)

export const invoiceController = new InvoiceController(invoiceService)
```

**8. Daftarkan entity** di `src/config/database.ts` (array `entities`)

**9. Tambahkan route** di `src/routes/api.ts`:

```typescript
import { invoiceController } from "../modules/invoice/invoice.module"

routes.get("/invoice", authMiddleware, (c) => invoiceController.index(c))
```

---

## Dokumentasi Lengkap

Dokumentasi detail tersedia di folder `docs/`:

| Dokumen | Isi |
|---------|-----|
| [`docs/architecture.md`](docs/architecture.md) | Arsitektur, struktur project, module pattern, DI, response format |
| [`docs/module-guide.md`](docs/module-guide.md) | Panduan step-by-step membuat module baru (13 langkah + contoh) |
| [`docs/testing-guide.md`](docs/testing-guide.md) | Cara menulis integration test, helper API, template |
| [`docs/swagger-guide.md`](docs/swagger-guide.md) | Cara menambah dokumentasi API di swagger.yaml |
| [`docs/api-reference.md`](docs/api-reference.md) | Daftar semua 90+ endpoint (method, path, auth, role) |

### Instruksi untuk AI Agent

| File | AI Tool | Deskripsi |
|------|---------|-----------|
| [`.agents/AGENTS.md`](.agents/AGENTS.md) | Google Antigravity | Conventions, patterns, do/don't rules |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code | Overview, commands, architecture summary |

