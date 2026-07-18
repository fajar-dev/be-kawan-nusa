/**
 * Jobs - Standalone scripts for scheduled tasks
 *
 * Available commands:
 * - bun run sync              → Sync users from NIS database
 * - bun run sync-customers    → Sync services, customers, phones, and customer services from NIS database
 * - bun run refresh-customers → Refresh EXISTING local customers & customer-services from NIS daily
 *                               (reconciles phones/emails — adds new, deletes removed)
 * - bun run expire-points     → Expire rewards that have passed their expiredDate
 * - bun run process-submissions → Process pending job_queues entries (sync NIS + create points)
 * - bun run generate-monthly-submissions → Create new PENDING submissions for active monthly schedules (with backfill)
 *
 * ─── Crontab Setup ─────────────────────────────────────────────────────
 *
 *   # Process queue — tiap 5 menit (agar point cepat masuk setelah approve)
 *   *​/5 * * * * cd /path/to/kawan-nusa-be && bun run process-submissions >> /var/log/kawan-nusa/process-queue.log 2>&1
 *
 *   # Monthly submissions — tiap hari jam 1 pagi (buat submission pending bulanan yang perlu di-approve)
 *   0 1 * * * cd /path/to/kawan-nusa-be && bun run generate-monthly-submissions >> /var/log/kawan-nusa/monthly-submissions.log 2>&1
 *
 */
