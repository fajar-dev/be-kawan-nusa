import { AppDataSource } from "../config/database"
import { JobQueue } from "../core/queue/entities/job-queue.entity"
import { JobQueueFailure } from "../core/queue/entities/job-queue-failure.entity"
import { QueueType } from "../core/queue/queue.constants"
import { NisHelper } from "../core/helpers/nis"
import { PointCalculator } from "../core/helpers/point"
import { logger } from "../core/helpers/logger"
import { IsNull } from "typeorm"

const JOB = "process-submissions"

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
            userId,
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
        logger.info("Job started", { job: JOB })
        const startTime = Date.now()

        await AppDataSource.initialize()
        logger.info("Database connected", { job: JOB })

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
            logger.info("No pending items", { job: JOB })
            await AppDataSource.destroy()
            process.exit(0)
        }

        logger.info("Found pending items", { job: JOB, count: pendingItems.length })

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
                logger.warn("Queue item skipped (retries exhausted)", { job: JOB, itemId: item.id, type: item.type, failureCount, maxRetries: MAX_RETRIES })
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
                logger.info("Queue item processed", { job: JOB, itemId: item.id, type: item.type, referenceId: item.referenceId, period: item.period })
            } catch (error: any) {
                failed++

                await failureRepo.save({
                    jobQueueId: item.id,
                    error: error.message || String(error),
                })

                logger.error("Queue item failed", { job: JOB, itemId: item.id, type: item.type, attempt: failureCount + 1, maxRetries: MAX_RETRIES, error: error.message })
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        logger.info("Job completed", { job: JOB, durationSeconds: Number(duration), processed, failed, skipped })

        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        logger.error("Job fatal error", { job: JOB, error: (error as Error)?.message, stack: (error as Error)?.stack })
        process.exit(1)
    }
}

run()
