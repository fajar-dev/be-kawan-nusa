import { AppDataSource } from "../config/database"
import { PointHelper } from "../core/helpers/point"

async function run() {
    try {
        console.log("[Expire] Starting expired points cleanup...")
        const startTime = Date.now()

        await AppDataSource.initialize()
        console.log("[Expire] Database connected")

        const totalExpired = await AppDataSource.transaction(async (manager) => {
            return await PointHelper.expirePoints(manager)
        })

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`[Expire] Completed in ${duration}s. Expired ${totalExpired} rewards.`)

        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        console.error("[Expire] Failed:", error)
        process.exit(1)
    }
}

run()
