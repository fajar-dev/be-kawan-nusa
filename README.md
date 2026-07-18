# Kawan Nusa — Referral Portal Backend

API Backend untuk **Kawan Nusa**, portal referral PT. Media Antar Nusa (Nusanet), dibangun dengan
**Hono**, **Bun**, dan **TypeORM (MySQL 8)**. Sistem ini mengelola mitra referral & karyawan
(RBAC), referral pelanggan, poin reward (FIFO + kedaluwarsa), pengajuan poin dari sistem internal
NIS, penukaran poin (tunai/produk/voucher), katalog reward, konten edukasi, dan statistik.

Frontend berada di repositori terpisah **kawan-nusa** (Nuxt 4 SPA).

> 📚 Dokumentasi detail: folder [`docs/`](docs/) · Panduan AI agent: [`CLAUDE.md`](CLAUDE.md) ·
> API interaktif: `GET /api/docs` (Swagger UI)

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Arsitektur](#arsitektur)
- [Struktur Proyek](#struktur-proyek)
- [Memulai](#memulai)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Job Terjadwal (Cron)](#job-terjadwal-cron)
- [API Endpoints](#api-endpoints)
- [Autentikasi & Otorisasi](#autentikasi--otorisasi)
- [Konvensi Kode](#konvensi-kode)
- [Testing](#testing)
- [Deployment](#deployment)
- [Dokumentasi Lengkap](#dokumentasi-lengkap)

---

## Tech Stack

| Kategori | Library / Tool |
| --- | --- |
| Runtime | [Bun](https://bun.sh) |
| Framework | [Hono](https://hono.dev) |
| Database | MySQL 8 (aplikasi) + MySQL NIS (read-only, sumber sinkronisasi) |
| ORM | TypeORM (`synchronize` via `DB_SYNC` — tanpa migrasi) |
| Validasi | Zod + @hono/zod-validator |
| Auth | JWT HS256 (`hono/jwt`) + Google OAuth (`google-auth-library`) + OTP (email/WhatsApp) |
| Storage | MinIO (S3-compatible) — diproksikan lewat `GET /api/proxy?path=` |
| Email | Nodemailer (SMTP, template HTML di `public/templates/`) |
| WhatsApp | NusaContact API (pengiriman OTP) |
| HR/Karyawan | Nusawork API (sinkron akun admin) |
| PDF | PDFKit |
| Gambar | sharp |
| Rate limit | hono-rate-limiter |
| Testing | Bun Test (~290 integration test) |
| Proses Manager | PM2 / Docker Compose |

---

## Arsitektur

**Clean Architecture** dengan prinsip **SOLID**, **manual constructor injection** (tanpa DI
container), dan **Repository Pattern**.

```
routes/api.ts                      ← SEMUA route + rantai middleware (satu sumber kebenaran)
    │
    └─ {module}.module.ts          ← Composition root (wiring DI)
           ├─ TypeOrmXxxRepository ← implements IXxxRepository
           ├─ XxxService           ← bisnis logik; menerima interface via constructor
           └─ XxxController        ← handler HTTP tipis
```

| Layer | Tanggung jawab |
| --- | --- |
| Controller | Parse request → panggil service → `ApiResponse` |
| Service | Bisnis logik & use case (tanpa konteks HTTP) |
| Repository Interface | Kontrak akses data (`interfaces/`) |
| TypeORM Repository | Implementasi akses data (`repositories/`) |
| Validator | Zod schema (`validators/`) |
| Serializer | Entity → response DTO (`serializers/`) |

Detail lengkap: [docs/architecture.md](docs/architecture.md).

---

## Struktur Proyek

```
kawan-nusa-be/
├── src/
│   ├── config/
│   │   ├── config.ts              # SEMUA env variable, terpusat
│   │   ├── database.ts            # AppDataSource (MySQL) + registrasi 34 entity
│   │   ├── nis-database.ts        # NisDataSource — MySQL NIS (read-only)
│   │   └── smtp.ts                # Nodemailer transporter
│   ├── core/
│   │   ├── exceptions/base.ts     # Hierarki custom exception (400–429)
│   │   ├── helpers/               # response, hash, mail, minio, nis, nusawork,
│   │   │                          # nusacontact, pdf, point (FIFO), withdraw, validator, logger
│   │   ├── interfaces/            # IBaseRepository, IUnitOfWork
│   │   ├── middlewares/           # auth, role, permission, api-key, rate-limit,
│   │   │                          # token-auth, logger
│   │   └── queue/                 # Entity job_queues & job_queue_failures + QueueType
│   ├── modules/                   # 22 feature module (pola seragam per module):
│   │   │                          #   auth, profile, user, employee, role,
│   │   │                          #   customer, customer-service, service, service-promotion,
│   │   │                          #   point, point-submission, redemption,
│   │   │                          #   catalog, catalog-category,
│   │   │                          #   education-article, education-video, education-category,
│   │   │                          #   template, feedback, statistic, additional, notification
│   │   └── {module}/
│   │       ├── {module}.module.ts / .controller.ts / .service.ts
│   │       ├── entities/  interfaces/  repositories/  serializers/  validators/
│   ├── jobs/                      # Script cron standalone (lihat bagian Job)
│   ├── routes/api.ts              # Definisi seluruh route
│   ├── database/seed.ts           # Menjalankan SQL dari database/seeders/
│   ├── app.ts                     # Hono app factory (CORS, logger, error handler, Swagger)
│   └── index.ts                   # Entry point (init DB + start server)
├── tests/                         # Integration test (1 file per module) + helpers
├── public/templates/              # Template HTML email
├── swagger.yaml                   # Spesifikasi OpenAPI (disajikan di /api/docs)
├── docker-compose.yaml            # app + MySQL 8
├── ecosystem.config.js            # PM2
└── .env.dist                      # Template environment
```

---

## Memulai

### Prasyarat

- [Bun](https://bun.sh) ≥ 1.0
- MySQL ≥ 8.0
- MinIO (untuk fitur upload) dan SMTP (untuk fitur email)

### Instalasi

```bash
bun install
cp .env.dist .env        # lalu isi nilainya (lihat bagian Environment)
bun run seed             # opsional: seed role admin default + matriks permission (role_seeder.sql)
bun run dev              # hot-reload; server di http://localhost:4000 (sesuai PORT)
```

Build produksi:

```bash
bun run build            # bundle ke dist/index.js
bun run start            # atau: pm2 start ecosystem.config.js
```

---

## Konfigurasi Environment

Salin `.env.dist` → `.env`. Kelompok variabel:

| Kelompok | Variabel | Keterangan |
| --- | --- | --- |
| Aplikasi | `PORT`, `ENV`, `APP_URL` | Port server (default 4000), environment, base URL publik |
| JWT | `JWT_SECRET`, `JWT_REFRESH_SECRET` | Access token 15 menit, refresh token 7 hari |
| API Key | `API_KEY` | Header `x-api-key` untuk `POST /point/reward` (server-to-server) |
| Database | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_SYNC` | MySQL aplikasi; `DB_SYNC=true` = TypeORM synchronize (tanpa migrasi) |
| NIS | `NIS_DB_HOST`, `NIS_DB_PORT`, `NIS_DB_USER`, `NIS_DB_PASS`, `NIS_DB_NAME` | MySQL NIS read-only (sumber sinkronisasi & pencarian akun) |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Email verifikasi/reset/OTP |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login Google (user & admin) |
| Nusawork | `NUSAWORK_API_URL`, `NUSAWORK_CLIENT_ID`, `NUSAWORK_CLIENT_SECRET` | Sinkron karyawan (akun admin) |
| NusaContact | `NUSACONTACT_API_URL`, `NUSACONTACT_API_KEY`, `NUSACONTACT_PHONE_ID` | OTP via WhatsApp |
| MinIO | `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` | Object storage (bucket default `kawan-nusa`) |
| Feedback | `FEEDBACK_URL` | URL Google AppScript penampung feedback |

> Jangan commit `.env`. Seluruh akses env harus lewat `src/config/config.ts`.

---

## Job Terjadwal (Cron)

Job adalah script standalone (bukan bagian proses server) — daftarkan di crontab host.
Contoh crontab ada di [src/jobs/index.ts](src/jobs/index.ts); detail alur di
[docs/jobs-and-integrations.md](docs/jobs-and-integrations.md).

| Perintah | Jadwal disarankan | Fungsi |
| --- | --- | --- |
| `bun run sync-users` | berkala | Sinkron mitra dari NIS (`Reseller`, `PartnerType='referral'`) |
| `bun run sync-customers` | berkala | Sinkron layanan, pelanggan, kontak, dan customer-service dari NIS (impor penuh) |
| `bun run refresh-customers` | harian 04:00 | Refresh data pelanggan & customer-service yang **sudah ada** di lokal dari NIS; rekonsiliasi telepon/email (tambah + **hapus** yang sudah tak ada) |
| `bun run sync-employees` | berkala | Sinkron karyawan dari Nusawork |
| `bun run expire-points` | harian | Hanguskan poin yang melewati `expiredDate` |
| `bun run process-submissions` | tiap 5 menit | Proses antrian `job_queues` → buat poin (retry max 5) |
| `bun run generate-monthly-submissions` | harian 01:00 | Buat submission pending bulanan (perlu di-approve) dari jadwal aktif, dengan backfill |

> **Penting:** poin dari approval submission **tidak langsung masuk** — menunggu cron
> `process-submissions`. Di dev, jalankan manual.

---

## API Endpoints

Referensi lengkap (±100 endpoint, dengan role & permission per route):
**[docs/api-reference.md](docs/api-reference.md)** — atau Swagger UI di `GET /api/docs`.

Ringkasan area:

| Area | Prefix | Akses |
| --- | --- | --- |
| Auth (register, login, Google, OTP, verifikasi, reset, refresh) | `/auth/*` | publik (+rate limit) |
| Profil & boarding mitra | `/profile/*` | user |
| Pelanggan, layanan, langganan | `/customer*`, `/service*` | user |
| Poin & reward | `/point`, `/point/reward` | user / API key |
| Penukaran (ajukan) | `/redemption/*` | user |
| Penukaran (proses tunai/produk/voucher) | `/redemption/{cash,product,voucher}/list*` | admin + permission |
| Manajemen mitra & approval registrasi | `/user/*` | admin + permission |
| Pengajuan poin + pencarian akun NIS | `/point-submission*`, `/nis/account` | admin + permission |
| RBAC role & permission matrix | `/role/*` | admin + permission |
| Katalog reward & kategori | `/catalog*` | baca: semua; tulis: admin |
| Konten edukasi (artikel/video/kategori/template/promosi) | `/education/*`, `/template*`, `/service/promotion*` | baca: semua; tulis: admin |
| Statistik dashboard | `/statistic/*` | user / admin |
| Feedback, master data & pencarian global | `/feedback`, `/additional/*` | semua terautentikasi |
| Proxy file MinIO | `/proxy?path=` | publik |

**Format response:** `{ success, statusCode, message, data }` (+`meta` paginasi
`{ total, perPage, currentPage, lastPage, from, to }` untuk list; `errors[]` untuk validasi 422).

---

## Autentikasi & Otorisasi

Dua jenis akun memakai skema JWT yang sama (claim `role` menentukan lookup):

- **`user`** (mitra referral) → tabel `users`; daftar via email/Google/OTP.
- **`admin`** (karyawan) → tabel `employees` (disinkron dari Nusawork); login via
  `/auth/admin/google`; membawa `Role.permissions` = `Record<module, ('L'|'T'|'E'|'H')[]>`
  (Lihat/Tambah/Edit/Hapus).

Rantai middleware per route (urutannya penting):

```
authMiddleware → roleMiddleware('admin') → permissionMiddleware('catalog', 'T') → handler
```

Middleware lain: `apiKeyMiddleware` (`x-api-key`), `rateLimitMiddleware(n)` (per menit per IP,
nonaktif saat `ENV=test`), `tokenAuthMiddleware` (JWT via query `?token=`).

---

## Konvensi Kode

### Pola Module

Setiap module: `entities/` → `interfaces/{nama}.repository.interface.ts` →
`repositories/typeorm-{nama}.repository.ts` → `{nama}.service.ts` → `{nama}.controller.ts` →
`validators/` → `serializers/` → `{nama}.module.ts` (composition root, ekspor controller).

Aturan utama:

- **Manual constructor injection** — service bergantung pada `IXxxRepository` (abstraksi),
  wiring hanya di `*.module.ts`; antar-module hanya boleh import dari `*.module.ts`.
- **Route hanya di `src/routes/api.ts`**, dikelompokkan per resource, validator via
  `zValidator("json"|"form", Schema, validationHook)`.
- **Response selalu lewat `ApiResponse`** (`success` / `paginate` / `error`).
- **Error selalu lewat custom exception** (`BadRequest` 400, `Unauthorized` 401, `Forbidden` 403,
  `NotFound` 404, `Conflict` 409, `Validator` 422, `TooManyValidators` 429) — global handler di
  `app.ts` yang memformat.
- **Mutasi poin/saldo wajib transaksi** via `PointCalculator` (FIFO + lazy expiration);
  pencairan tunai memakai `calculateWithdrawal` (1 poin = Rp 1.000, pajak 2,5%).
- **File/gambar disimpan ke MinIO** (`core/helpers/minio.ts`), disajikan lewat `/api/proxy?path=`.
- Pesan yang dilihat pengguna (email, error) berbahasa **Indonesia**.
- Naming: file `kebab-case`, class `PascalCase`, interface `I` + PascalCase, method/variabel
  `camelCase`, konstanta `UPPER_SNAKE_CASE`.

Panduan langkah demi langkah membuat module baru: [docs/module-guide.md](docs/module-guide.md).

---

## Testing

```bash
bun test                                   # semua (~290 test integrasi)
bun test tests/integration/role.test.ts    # satu file
```

- Test integrasi memanggil app Hono langsung (tanpa server terpisah) — helper di
  `tests/helpers/` (`test-client.ts`, `auth.helper.ts`).
- `tests/setup.ts` membuka koneksi DB — **butuh MySQL berjalan**; gunakan database khusus test.
- Rate limiter otomatis nonaktif saat `ENV=test`.
- Panduan menulis test: [docs/testing-guide.md](docs/testing-guide.md).

---

## Deployment

### Produksi dengan PM2 (rekomendasi)

```bash
bun install
cp .env.dist .env            # isi semua variabel (lihat tabel Environment)
bun run build                # → dist/index.js
bun run seed                 # sekali: role admin default + matriks permission

pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup      # jalan otomatis setelah reboot
pm2 logs kawan-nusa-be
```

Config produksi tersedia di folder [`deploy/`](deploy/) dan file [`ecosystem.config.js`](ecosystem.config.js):

| File | Fungsi |
| --- | --- |
| [`ecosystem.config.js`](ecosystem.config.js) | PM2: fork mode, restart policy, `NODE_ENV=production`, path log `logs/pm2-*.log` |
| [`deploy/crontab.example`](deploy/crontab.example) | Semua job terjadwal (queue, recurring, expire, sync) + pembersihan log harian — `crontab -e`, sesuaikan `APP_DIR`/`BUN` |
| [`deploy/promtail-config.yaml`](deploy/promtail-config.yaml) | Promtail men-tail `logs/app-*.log` → Loki, parse JSON jadi label (`level`/`service`/`env`) |
| [`deploy/logrotate.conf`](deploy/logrotate.conf) | Rotasi + retensi file PM2 (`logs/pm2-*.log`) |

**Alur observability:** app menulis JSON ke stdout **dan** `logs/app-YYYY-MM-DD.log` (rotasi harian) →
Promtail men-tail file itu → Loki → Grafana. File harian dipangkas via cron (30 hari, lihat crontab).
Cukup ganti placeholder di `deploy/promtail-config.yaml` (URL Loki + path absolut `logs/`).

**Docker Compose** (alternatif): `docker compose up -d` — service `app` (port 4000) + `db` (MySQL 8).
Compose file belum memuat env NIS/MinIO/Google/Nusawork — lengkapi bila memakai Docker.

Skema DB dikelola `DB_SYNC` (tanpa migrasi) — matikan di produksi bila skema sudah stabil.

---

## Dokumentasi Lengkap

| Dokumen | Isi |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Arsitektur, layer, pola module, middleware, invarian domain |
| [docs/api-reference.md](docs/api-reference.md) | Seluruh endpoint (method, path, auth, role, permission) |
| [docs/jobs-and-integrations.md](docs/jobs-and-integrations.md) | Job cron, queue, alur point submission, integrasi NIS/Nusawork/NusaContact/MinIO |
| [docs/module-guide.md](docs/module-guide.md) | Panduan step-by-step membuat module baru |
| [docs/testing-guide.md](docs/testing-guide.md) | Cara menulis integration test |
| [docs/swagger-guide.md](docs/swagger-guide.md) | Cara memperbarui swagger.yaml |
| [CLAUDE.md](CLAUDE.md) | Panduan ringkas untuk AI coding agent |
| [.agents/AGENTS.md](.agents/AGENTS.md) | Aturan konvensi untuk AI agent lain |

### Repositori Terkait

| Repo | Deskripsi |
| --- | --- |
| `kawan-nusa` | Frontend — Nuxt 4 SPA + PWA (Tailwind v4 + DaisyUI). Punya dokumentasi sendiri di `docs/` dan `CLAUDE.md` |
