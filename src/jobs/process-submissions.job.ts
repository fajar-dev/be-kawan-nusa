import { AppDataSource } from "../config/database"
import { PointSubmissionRepository } from "../modules/point-submission/repositories/point-submission.repository"
import { PointSubmissionService } from "../modules/point-submission/point-submission.service"
import { NisHelper } from "../core/helpers/nis"
import { PointCalculator } from "../core/helpers/point"
import { TypeOrmUnitOfWork } from "../core/interfaces/unit-of-work.interface"

const MAX_RETRIES = 5
const BATCH_SIZE = 10

async function run() {
    try {
        console.log("[ProcessSubmissions] Starting...")
        const startTime = Date.now()

        await AppDataSource.initialize()
        console.log("[ProcessSubmissions] Database connected")

        const repository = new PointSubmissionRepository()
        const nisHelper = new NisHelper()
        const pointCalculator = new PointCalculator()
        const unitOfWork = new TypeOrmUnitOfWork()
        const service = new PointSubmissionService(repository, nisHelper, pointCalculator, unitOfWork)

        // Fetch unprocessed approved submissions
        const submissions = await repository.findUnprocessed(BATCH_SIZE, MAX_RETRIES)

        if (submissions.length === 0) {
            console.log("[ProcessSubmissions] No pending submissions to process")
            await AppDataSource.destroy()
            process.exit(0)
        }

        console.log(`[ProcessSubmissions] Found ${submissions.length} submission(s) to process`)

        let successCount = 0
        let failCount = 0

        for (const submission of submissions) {
            try {
                await service.processSubmission(submission)
                successCount++
                console.log(`[ProcessSubmissions] ✅ #${submission.id} → Point created`)
            } catch (error: any) {
                failCount++
                const errorMsg = error.message || String(error)
                await service.markFailed(submission.id, errorMsg)
                console.error(`[ProcessSubmissions] ❌ #${submission.id} (retry ${submission.retryCount + 1}/${MAX_RETRIES}) → ${errorMsg}`)
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`[ProcessSubmissions] Completed in ${duration}s. Success: ${successCount}, Failed: ${failCount}`)

        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        console.error("[ProcessSubmissions] Fatal error:", error)
        process.exit(1)
    }
}

run()
