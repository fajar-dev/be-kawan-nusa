import { AppDataSource } from "../config/database"
import { JobQueue } from "../core/queue/entities/job-queue.entity"
import { JobQueueFailure } from "../core/queue/entities/job-queue-failure.entity"
import { QueueType } from "../core/queue/queue.constants"
import { NisHelper } from "../core/helpers/nis"
import { PointCalculator } from "../core/helpers/point"
import { IsNull } from "typeorm"

const BATCH_SIZE = 50
const MAX_RETRIES = 5

/**
 * Process Job Queue
 *
 * Picks up pending entries from `job_queues` (processedAt IS NULL),
 * routes to the appropriate processor based on `type`.
 *
 * On success: sets processedAt on the queue entry.
 * On failure: logs to `job_queue_failures` table.
 *
 * Skips items that have failed >= MAX_RETRIES times.
 *
 * Usage: bun run process-submissions
 */

// ── Processors ─────────────────────────────────────────────────────────

async function processPointSubmission(item: JobQueue, nisHelper: NisHelper, pointCalculator: PointCalculator): Promise<void> {
    const { customerServiceId, userId, price, point, pointType } = item.payload

    // Step 1: Sync NIS account to local DB
    const syncResult = await nisHelper.syncAccountToLocal(customerServiceId, userId)
    if (!syncResult) {
        throw new Error(`Failed to sync NIS account for custServId ${customerServiceId}`)
    }

    // Step 2: Create Point + mark processed in ONE transaction
    await AppDataSource.transaction(async (manager) => {
        await pointCalculator.addPointsReward(manager, {
            customerServiceId: syncResult.customerServiceId,
            price,
            point,
            remainingPoint: point,
            type: pointType,
            pointSubmissionId: item.referenceId,
        })

        await manager.getRepository(JobQueue).update(item.id, {
            processedAt: new Date(),
        })
    })
}

// ── Main ───────────────────────────────────────────────────────────────

async function run() {
    try {
        console.log("[ProcessQueue] Starting...")
        const startTime = Date.now()

        await AppDataSource.initialize()
        console.log("[ProcessQueue] Database connected")

        const queueRepo = AppDataSource.getRepository(JobQueue)
        const failureRepo = AppDataSource.getRepository(JobQueueFailure)
        const nisHelper = new NisHelper()
        const pointCalculator = new PointCalculator()

        // Find pending queue entries
        const pendingItems = await queueRepo.find({
            where: { processedAt: IsNull() },
            order: { createdAt: "ASC" },
            take: BATCH_SIZE,
        })

        if (pendingItems.length === 0) {
            console.log("[ProcessQueue] No pending items")
            await AppDataSource.destroy()
            process.exit(0)
        }

        console.log(`[ProcessQueue] Found ${pendingItems.length} pending item(s)`)

        let processed = 0
        let failed = 0
        let skipped = 0

        for (const item of pendingItems) {
            // Count previous failures
            const failureCount = await failureRepo.count({
                where: { jobQueueId: item.id },
            })

            if (failureCount >= MAX_RETRIES) {
                skipped++
                console.log(`[ProcessQueue] ⏭ #${item.id} [${item.type}] → Skipped (${failureCount}/${MAX_RETRIES} retries exhausted)`)
                continue
            }

            try {
                // Route to appropriate processor based on type
                switch (item.type) {
                    case QueueType.POINT_SUBMISSION:
                        await processPointSubmission(item, nisHelper, pointCalculator)
                        break
                    default:
                        throw new Error(`Unknown queue type: ${item.type}`)
                }

                processed++
                console.log(
                    `[ProcessQueue] ✅ #${item.id} [${item.type}] → Processed ` +
                    `(ref #${item.referenceId}, period ${item.period})`
                )
            } catch (error: any) {
                failed++

                await failureRepo.save({
                    jobQueueId: item.id,
                    error: error.message || String(error),
                })

                console.error(
                    `[ProcessQueue] ❌ #${item.id} [${item.type}] → ${error.message} ` +
                    `(attempt ${failureCount + 1}/${MAX_RETRIES})`
                )
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(
            `[ProcessQueue] Completed in ${duration}s. ` +
            `Processed: ${processed}, Failed: ${failed}, Skipped: ${skipped}`
        )

        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        console.error("[ProcessQueue] Fatal error:", error)
        process.exit(1)
    }
}

run()
