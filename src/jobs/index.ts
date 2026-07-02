/**
 * Jobs - Standalone scripts for scheduled tasks
 *
 * Available commands:
 * - bun run sync              → Sync users from NIS database
 * - bun run sync-customers    → Sync services, customers, phones, and customer services from NIS database
 * - bun run expire-points     → Expire rewards that have passed their expiredDate
 * - bun run process-submissions → Process pending job_queues entries (sync NIS + create points)
 * - bun run recurring-points  → Create queue entries for monthly recurring submissions (with backfill)
 *
 * ─── Crontab Setup ─────────────────────────────────────────────────────
 *
 *   # Process queue — tiap 5 menit (agar point cepat masuk setelah approve)
 *   *​/5 * * * * cd /path/to/kawan-nusa-be && bun run process-submissions >> /var/log/kawan-nusa/process-queue.log 2>&1
 *
 *   # Recurring points — tiap hari jam 1 pagi (cek & buat antrian bulanan)
 *   0 1 * * * cd /path/to/kawan-nusa-be && bun run recurring-points >> /var/log/kawan-nusa/recurring-points.log 2>&1
 *
 */
