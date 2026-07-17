import { AppDataSource } from "../config/database"
import { logger } from "../core/helpers/logger"
import { PointCalculator } from "../core/helpers/point"

async function run() {
    try {
        logger.info("Starting expired points cleanup...")
        const startTime = Date.now()

        await AppDataSource.initialize()
        logger.info("Database connected")

        const pointCalculator = new PointCalculator()
        const totalExpired = await AppDataSource.transaction(async (manager) => {
            return await pointCalculator.expirePoints(manager)
        })

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        logger.info(`Completed in ${duration}s. Expired ${totalExpired} rewards.`)

        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        logger.error("Expired points job failed", { error: (error as any)?.message, stack: (error as any)?.stack })
        process.exit(1)
    }
}

run()
