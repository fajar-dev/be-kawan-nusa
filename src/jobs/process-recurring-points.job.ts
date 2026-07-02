import { AppDataSource } from "../config/database"
import { PointSubmission } from "../modules/point-submission/entities/point-submission.entity"
import { JobQueue } from "../core/queue/entities/job-queue.entity"
import { QueueType } from "../core/queue/queue.constants"
import { PointSubmissionStatus } from "../modules/point-submission/point-submission.enum"
import { Not, IsNull } from "typeorm"

/**
 * Recurring Points Job
 *
 * Runs daily via cron. For each recurring approved submission:
 * 1. Checks all months from createdAt to now (backfill if missed)
 * 2. For each month where target day has passed and no queue entry exists → create one
 * 3. The process-submissions job then picks up and processes them
 *
 * Date logic:
 * - Target day = day-of-month from submission's createdAt
 * - If month has fewer days (e.g. Feb 28), uses last day of month
 * - Example: created Jan 31 → Feb 28, Mar 31, Apr 30, ...
 *
 * Usage: bun run recurring-points
 */

function getTargetDay(originalDay: number, year: number, month: number): number {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    return Math.min(originalDay, lastDayOfMonth)
}

async function run() {
    try {
        console.log("[RecurringPoints] Starting...")
        const startTime = Date.now()

        await AppDataSource.initialize()
        console.log("[RecurringPoints] Database connected")

        const today = new Date()
        const todayDate = today.getDate()
        const currentYear = today.getFullYear()
        const currentMonth = today.getMonth()

        const submissionRepo = AppDataSource.getRepository(PointSubmission)
        const queueRepo = AppDataSource.getRepository(JobQueue)

        // Find recurring approved submissions
        const submissions = await submissionRepo.find({
            where: {
                isRecurring: true,
                status: PointSubmissionStatus.APPROVED,
            },
        })

        if (submissions.length === 0) {
            console.log("[RecurringPoints] No recurring submissions found")
            await AppDataSource.destroy()
            process.exit(0)
        }

        console.log(`[RecurringPoints] Found ${submissions.length} recurring submission(s)`)

        let created = 0
        let skipped = 0
        let expired = 0

        for (const submission of submissions) {
            // Check if initial queue entry has been processed
            const initialProcessed = await queueRepo.count({
                where: {
                    type: QueueType.POINT_SUBMISSION,
                    referenceId: submission.id,
                    processedAt: Not(IsNull()),
                },
            })

            if (initialProcessed === 0) {
                skipped++
                continue
            }

            const createdAt = new Date(submission.createdAt)
            const originalDay = createdAt.getDate()

            // Start from the month AFTER createdAt
            let loopYear = createdAt.getFullYear()
            let loopMonth = createdAt.getMonth() + 1
            if (loopMonth > 11) {
                loopMonth = 0
                loopYear++
            }

            // Loop through all months up to current month
            while (
                loopYear < currentYear ||
                (loopYear === currentYear && loopMonth <= currentMonth)
            ) {
                const periodDate = new Date(loopYear, loopMonth, 1)

                // Check recurringEndDate
                if (submission.recurringEndDate) {
                    const endDate = new Date(submission.recurringEndDate)
                    if (periodDate > endDate) {
                        expired++
                        break
                    }
                }

                // Calculate target day for this month
                const targetDay = getTargetDay(originalDay, loopYear, loopMonth)

                // For current month: only create if today >= targetDay
                // For past months: always create (backfill)
                const isPastMonth = loopYear < currentYear || (loopYear === currentYear && loopMonth < currentMonth)
                if (!isPastMonth && todayDate < targetDay) {
                    skipped++
                } else {
                    // Check if queue entry already exists for this period
                    const existingEntry = await queueRepo.count({
                        where: {
                            type: QueueType.POINT_SUBMISSION,
                            referenceId: submission.id,
                            period: periodDate,
                        },
                    })

                    if (existingEntry === 0) {
                        await queueRepo.save({
                            type: QueueType.POINT_SUBMISSION,
                            referenceId: submission.id,
                            payload: {
                                customerServiceId: submission.nisData.custServId,
                                userId: submission.userId,
                                price: Number(submission.price),
                                point: Math.floor(Number(submission.price) / 100),
                                pointType: submission.type,
                            },
                            period: periodDate,
                        })
                        created++
                        console.log(
                            `[RecurringPoints] 📋 #${submission.id} → Queue entry created ` +
                            `(${loopMonth + 1}/${loopYear}, day ${targetDay})`
                        )
                    } else {
                        skipped++
                    }
                }

                // Next month
                loopMonth++
                if (loopMonth > 11) {
                    loopMonth = 0
                    loopYear++
                }
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(
            `[RecurringPoints] Completed in ${duration}s. ` +
            `Queued: ${created}, Skipped: ${skipped}, Expired: ${expired}`
        )

        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        console.error("[RecurringPoints] Fatal error:", error)
        process.exit(1)
    }
}

run()
