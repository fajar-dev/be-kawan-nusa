import { AppDataSource } from "../config/database"
import { PointSubmission } from "../modules/point-submission/entities/point-submission.entity"
import { PointSubmissionSchedule } from "../modules/point-submission/entities/point-submission-schedule.entity"
import { PointSubmissionStatus } from "../modules/point-submission/point-submission.enum"
import { PointType } from "../modules/point/point.enum"
import { logger } from "../core/helpers/logger"

const JOB = "generate-monthly-submissions"

/**
 * Generate Monthly Submissions Job
 *
 * Runs daily via cron. For each ACTIVE schedule (created when a "Bulanan"
 * submission was first approved), creates a NEW pending point_submission for
 * every month that is due — which an admin must then approve. There is no end
 * date; a schedule keeps generating until it is stopped (isActive=false).
 *
 * Date logic:
 * - targetDay = schedule.anchorDay, clamped to the month's last day (31 Jan → 28 Feb)
 * - past months are always backfilled; the current month only fires once today >= targetDay
 * - the unique (scheduleId, period) constraint on point_submissions prevents duplicates
 *
 * Usage: bun run generate-monthly-submissions
 */

function getTargetDay(originalDay: number, year: number, month: number): number {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    return Math.min(originalDay, lastDayOfMonth)
}

async function run() {
    try {
        logger.info("Job started", { job: JOB })
        const startTime = Date.now()

        await AppDataSource.initialize()
        logger.info("Database connected", { job: JOB })

        const today = new Date()
        const todayDate = today.getDate()
        const currentYear = today.getFullYear()
        const currentMonth = today.getMonth()

        const scheduleRepo = AppDataSource.getRepository(PointSubmissionSchedule)
        const submissionRepo = AppDataSource.getRepository(PointSubmission)

        const schedules = await scheduleRepo.find({ where: { isActive: true } })

        if (schedules.length === 0) {
            logger.info("No active schedules", { job: JOB })
            await AppDataSource.destroy()
            process.exit(0)
        }

        logger.info("Found active schedules", { job: JOB, count: schedules.length })

        let created = 0
        let skipped = 0

        for (const schedule of schedules) {
            const lastPeriod = new Date(schedule.lastGeneratedPeriod)

            // Start from the month AFTER the last generated period
            let loopYear = lastPeriod.getFullYear()
            let loopMonth = lastPeriod.getMonth() + 1
            if (loopMonth > 11) {
                loopMonth = 0
                loopYear++
            }

            while (loopYear < currentYear || (loopYear === currentYear && loopMonth <= currentMonth)) {
                const periodDate = new Date(loopYear, loopMonth, 1)
                const targetDay = getTargetDay(schedule.anchorDay, loopYear, loopMonth)
                const isPastMonth = loopYear < currentYear || (loopYear === currentYear && loopMonth < currentMonth)

                // Current month only fires once today has reached the target day.
                if (!isPastMonth && todayDate < targetDay) {
                    skipped++
                    break
                }

                try {
                    // Idempotent: skip if a submission for this schedule+period already exists.
                    const existing = await submissionRepo.count({ where: { scheduleId: schedule.id, period: periodDate } })
                    if (existing === 0) {
                        await submissionRepo.save(submissionRepo.create({
                            userId: schedule.userId,
                            type: PointType.BULANAN,
                            price: schedule.price,
                            point: Math.floor(Number(schedule.price) / 100),
                            nisData: schedule.nisData,
                            status: PointSubmissionStatus.PENDING,
                            scheduleId: schedule.id,
                            period: periodDate,
                            createdById: schedule.createdById,
                        }))
                        created++
                        logger.info("Submission generated", { job: JOB, scheduleId: schedule.id, month: loopMonth + 1, year: loopYear, day: targetDay })
                    } else {
                        skipped++
                    }

                    // Advance the watermark so this period is never reconsidered.
                    await scheduleRepo.update(schedule.id, { lastGeneratedPeriod: periodDate })
                } catch (error: any) {
                    logger.error("Failed to generate submission", { job: JOB, scheduleId: schedule.id, period: periodDate, error: error.message })
                    break
                }

                loopMonth++
                if (loopMonth > 11) {
                    loopMonth = 0
                    loopYear++
                }
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        logger.info("Job completed", { job: JOB, durationSeconds: Number(duration), created, skipped })

        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        logger.error("Job fatal error", { job: JOB, error: (error as Error)?.message, stack: (error as Error)?.stack })
        process.exit(1)
    }
}

run()
