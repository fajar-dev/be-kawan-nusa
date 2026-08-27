# Jobs, Queue & Integrasi Eksternal

Backend Kawan Nusa bergantung pada beberapa job terjadwal (cron) dan integrasi sistem eksternal.
Dokumen ini merangkum semuanya. Sumber: [src/jobs/](../src/jobs/), [src/core/queue/](../src/core/queue/),
[src/core/helpers/](../src/core/helpers/), [src/config/config.ts](../src/config/config.ts).

## Ringkasan Job (semua standalone, dijalankan via cron)

| Perintah | File | Jadwal disarankan | Fungsi |
|---|---|---|---|
| `bun run sync-users` | `sync-users.job.ts` | berkala | Sinkron mitra referral dari **NIS DB** (tabel `Reseller`, `PartnerType='referral'`) ke tabel `users` |
| `bun run sync-customers` | `sync-customers.job.ts` | berkala | Sinkron (impor penuh) services, customers, phones/emails, dan customer-services dari NIS DB |
| `bun run refresh-customers` | `refresh-customers.job.ts` | harian 04:00 | Refresh **hanya** customer & customer-service yang sudah ada di lokal (keyed by ID lokal, tidak impor baru). Phone/email **direkonsiliasi**: baris yang hilang di NIS **dihapus**, yang ada di-upsert. Customer yang tak ada lagi di NIS dibiarkan (tidak dihapus) |
| `bun run sync-employees` | `sync-employees.job.ts` | berkala | Sinkron karyawan dari **Nusawork API** ke tabel `employees` (akun admin) |
| `bun run expire-points` | `expire-points.job.ts` | harian | Menghanguskan reward yang melewati `expiredDate` (via `PointCalculator.expirePoints`) |
| `bun run process-submissions` | `process-submissions.job.ts` | tiap 5 menit | **Retry saja**: memproses sisa antrian `job_queues` (entri yang gagal saat percobaan langsung di approve) → ambil data NIS → buat poin. Batch 50, max 5 retry, gagal dicatat ke `job_queue_failures` |
| `bun run generate-monthly-submissions` | `generate-monthly-submissions.job.ts` | harian 01:00 | Untuk tiap **jadwal aktif** (`point_submission_schedules`): buat **submission pending baru** tiap bulan (yang harus di-approve admin), dengan **backfill** bulan terlewat dan penyesuaian tanggal (31 Jan → 28 Feb, dst.). Tanpa tanggal berakhir; berhenti saat jadwal di-stop |

Contoh crontab lengkap ada di [src/jobs/index.ts](../src/jobs/index.ts). Setiap job membuka dan
menutup koneksi database sendiri (`AppDataSource.initialize()` … `destroy()`), lalu `process.exit`.

## Alur Point Submission (langsung saat approve, queue sebagai fallback)

```
Admin buat submission ──► approve (POST /point-submission/approve)
        │                          │
        ▼                          ▼
   status: pending ──► approved   dalam request yang sama, untuk tiap submission:
                                     - sync akun dari NIS DB (NisHelper.syncAccountToLocal)
                                     - buat baris Point via PointCalculator (transaksi)
                                     - notifikasi user (fire-and-forget)
                                     ┌─ sukses → selesai, poin langsung muncul
                                     └─ gagal (mis. NIS timeout) → tulis baris job_queues
                                                (payload: customerServiceId, userId, price,
                                                point, pointType) untuk di-retry

                        cron process-submissions (tiap 5 menit, RETRY-ONLY):
                          - ambil entri job_queues dgn processedAt IS NULL (batch 50)
                          - ulangi proses yang sama (sync NIS → buat Point)
                          - sukses → set processedAt; gagal → job_queue_failures (max 5 retry)

   submission Bulanan (type='Bulanan'):
        approve pertama membuat baris di point_submission_schedules
                        cron generate-monthly-submissions (harian):
                          - untuk tiap jadwal aktif, tiap bulan sejak lastGeneratedPeriod yang
                            tanggal targetnya sudah lewat & belum ada submission → buat
                            SUBMISSION pending baru (perlu di-approve admin), lalu di-approve
                            mengikuti alur di atas (langsung, dengan fallback ke queue)
                          - berhenti saat jadwal di-stop (isActive=false); tanpa tanggal berakhir
```

Logika inti (sync NIS + buat Point + notifikasi) ada di satu tempat:
[`src/core/helpers/point-submission-processor.ts`](../src/core/helpers/point-submission-processor.ts)
(`createPointFromSubmission`), dipakai baik oleh `approve()` (percobaan langsung) maupun oleh
`process-submissions` (retry saat percobaan langsung gagal).

Konsekuensi: poin biasanya **langsung muncul setelah approve**. Hanya tertunda (menunggu cron
`process-submissions` berikutnya) jika percobaan langsung gagal — dicatat sebagai `logger.error`
("Immediate point creation failed on approve, falling back to queue").

## Integrasi Eksternal

| Integrasi | Helper | Konfigurasi | Dipakai untuk |
|---|---|---|---|
| **NIS DB** (MySQL read-only) | `core/helpers/nis.ts` + `config/nis-database.ts` (`NisDataSource`) | `NIS_DB_*` | Sumber data mitra/pelanggan/layanan; pencarian akun (`GET /nis/account`); data poin saat memproses antrian |
| **Nusawork** (HR API) | `core/helpers/nusawork.ts` | `NUSAWORK_API_URL/CLIENT_ID/CLIENT_SECRET` | Sinkron data karyawan (akun admin) |
| **NusaContact** (WhatsApp Business API) | `core/helpers/nusacontact.ts` | `NUSACONTACT_API_URL/API_KEY/PHONE_ID` | Kirim OTP login via WhatsApp (template `otp_kawan_nusa`) |
| **Google OAuth** | `google-auth-library` (module auth) | `GOOGLE_CLIENT_ID/CLIENT_SECRET` | Login Google user & admin (exchange `code`) |
| **MinIO** (S3-compatible) | `core/helpers/minio.ts` | `MINIO_*` (bucket default `kawan-nusa`) | Penyimpanan semua upload (foto, KTP, gambar katalog/artikel, template, bukti transfer). Objek disajikan lewat `GET /api/proxy?path=` |
| **SMTP** | `core/helpers/mail.ts` + `config/smtp.ts` | `SMTP_*` | Email verifikasi, reset password, OTP; template HTML di `public/templates/` |
| **Google AppScript** | module feedback | `FEEDBACK_URL` | Meneruskan feedback pengguna ke spreadsheet |
| **IS5** | `core/helpers/is5.ts` | `IS5_API_URL/API_KEY` | Saat status user diubah menjadi `active` (approve registrasi): upload foto KTP sebagai attachment, lalu daftarkan partner (`POST /api/v2/client/partners`). Fire-and-forget dari `UserService.updateStatus`, gagal hanya dicatat via `logger.error` (event `is5.failed`) — tidak membatalkan approval |

## Logika Bisnis Poin (core/helpers)

### `PointCalculator` (`point.ts`) — mesin poin FIFO

- `getAvailablePoints(manager, userId)` — saldo = jumlah `remainingPoint` reward yang belum
  kedaluwarsa; **lazy expiration** dijalankan dulu.
- `subtractPointsFIFO(manager, userId, amount)` — potong poin dari reward yang paling cepat
  kedaluwarsa lebih dulu (order `expiredDate ASC, createdAt ASC`); lempar `BadRequestException`
  jika saldo kurang.
- `expirePoints(manager, userId?)` — nol-kan `remainingPoint` reward kedaluwarsa (dipakai lazy
  di atas dan oleh job `expire-points`).
- Semua method menerima `EntityManager` — **wajib dipanggil di dalam transaksi**.

### `calculateWithdrawal` (`withdraw.ts`)

```
grossPayout = poin × Rp 1.000
tax         = 2,5% × grossPayout
payout      = grossPayout − tax
```

### Lainnya

- `pdf.ts` — generate PDF (bukti/receipt) dengan PDFKit.
- `hash.ts` — bcrypt untuk password.
- `logger.ts` + `logger.middleware.ts` — request log & error log (folder `logs/`).

## Deployment

- **PM2**: `bun run build` → `pm2 start ecosystem.config.js` (menjalankan `dist/index.js`
  dengan interpreter bun, `max_memory_restart: 1G`).
- **Docker Compose**: `docker-compose.yaml` berisi service `app` (build dari `Dockerfile`,
  port 4000) + `db` (MySQL 8 dengan healthcheck & volume `mysql_data`). Catatan: compose file
  belum memuat env NIS/MinIO/Google/Nusawork — lengkapi sesuai kebutuhan.
- Job cron **tidak** dikelola PM2/compose — daftarkan manual di crontab host (contoh di
  `src/jobs/index.ts`).
- Skema DB dikelola `DB_SYNC` (TypeORM synchronize). **Tidak ada migrasi** — hati-hati mengubah
  entity terhadap data produksi; matikan `DB_SYNC` di produksi bila skema sudah stabil.
