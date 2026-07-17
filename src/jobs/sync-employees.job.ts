import { AppDataSource } from "../config/database"
import { logger } from "../core/helpers/logger"
import { Employee } from "../modules/employee/entities/employee.entity"
import { nusaworkHelper } from "../core/helpers/nusawork"

async function sync() {
    try {
        logger.info("Starting employee sync from Nusawork...")
        const startTime = Date.now()

        await AppDataSource.initialize()
        logger.info("App database connected")

        const employees = await nusaworkHelper.getEmployees()
        if (employees.length === 0) {
            logger.info("No employees found from Nusawork")
            process.exit(0)
        }

        logger.info(`Fetched ${employees.length} active employees from Nusawork`)

        const repo = AppDataSource.getRepository(Employee)
        const batchSize = 500
        let synced = 0

        // Pass 1: Upsert all employees without managerId
        for (let i = 0; i < employees.length; i += batchSize) {
            const batch = employees.slice(i, i + batchSize)
            const entities = batch.map(emp => {
                return repo.create({
                    id: emp.user_id,
                    employeeId: emp.employee_id,
                    name: emp.full_name,
                    email: emp.email,
                    photo: emp.photo_profile,
                    jobPosition: emp.job_position,
                    phone: emp.whatsapp || emp.mobile_phone,
                    isActive: true,
                })
            })

            await repo.upsert(entities, ["id"])
            synced += entities.length
        }

        logger.info(`Pass 1: Synced ${synced} employees`)

        // Build a map of user_id -> id for manager lookup
        const userIdMap = new Map<number, number>()
        for (const emp of employees) {
            userIdMap.set(emp.user_id, emp.user_id)
        }

        // Pass 2: Update managerId
        let managersUpdated = 0
        for (const emp of employees) {
            const managerId = emp.id_report_to_value ? (userIdMap.get(Number(emp.id_report_to_value)) ?? null) : null
            await repo.update(emp.user_id, { managerId })
            if (managerId) managersUpdated++
        }

        logger.info(`Pass 2: Updated ${managersUpdated} manager relations`)

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        logger.info(`Completed in ${duration}s. Synced ${synced} employees.`)

        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        logger.error("Sync job failed", { error: (error as any)?.message, stack: (error as any)?.stack })
        process.exit(1)
    }
}

sync()
