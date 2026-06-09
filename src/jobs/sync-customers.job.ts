import { AppDataSource } from "../config/database"
import { NisDataSource } from "../config/nis-database"
import { Customer } from "../modules/customer/entities/customer.entity"
import { Service } from "../modules/service/entities/service.entity"
import { CustomerService } from "../modules/customer-service/entities/customer-service.entity"
import { User } from "../modules/user/entities/user.entity"

/**
 * Sync customers & services from source database.
 * Run: bun run sync
 */
async function sync() {
    try {
        console.log("[Sync] Starting sync...")
        const startTime = Date.now()

        await AppDataSource.initialize()
        console.log("[Sync] App database connected")

        await NisDataSource.initialize()
        console.log("[Sync] Source database connected")

        await syncUsers()

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`[Sync] Completed in ${duration}s`)

        await NisDataSource.destroy()
        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        console.error("[Sync] Failed:", error)
        process.exit(1)
    }
}

/**
 * Sync users from NIS Reseller table (PartnerType = 'referral')
 */
async function syncUsers() {
    const sourceRows: any[] = await NisDataSource.query(`
        SELECT 
            r.Id AS id, 
            SUBSTRING_INDEX(r.Name, ' ', 1) AS first_name,
            TRIM(SUBSTRING(r.Name, LENGTH(SUBSTRING_INDEX(r.Name, ' ', 1)) + 1)) AS last_name,
            r.Phone AS phone,
            r.Email AS email,
            r.Company AS company,
            r.BankAccountNumber AS account_number,
            r.BankAccountName AS account_holder_name,
            r.BankAccountType AS bank_name,
            r.IdentityNumber AS identity_number,
            CASE 
                WHEN r.Status = 'AC' THEN 1
                WHEN r.Status = 'NA' THEN 0
                ELSE NULL
            END AS is_active
        FROM Reseller r
        WHERE r.PartnerType = 'referral'
    `)

    if (sourceRows.length === 0) {
        console.log("[Sync] No users found in source")
        return
    }

    const repo = AppDataSource.getRepository(User)
    const batchSize = 500

    for (let i = 0; i < sourceRows.length; i += batchSize) {
        const batch = sourceRows.slice(i, i + batchSize)
        const entities = batch.map(row => repo.create({
            id: row.id,
            firstName: row.first_name || '',
            lastName: row.last_name || '',
            phone: row.phone || null,
            email: row.email || null,
            company: row.company || null,
            accountNumber: row.account_number || null,
            accountHolderName: row.account_holder_name || null,
            bankName: row.bank_name || null,
            identityNumber: row.identity_number || null,
            isActive: row.is_active === 1,
        }))

        await repo.upsert(entities, ["id"])
    }

    console.log(`[Sync] Synced ${sourceRows.length} users`)
}

sync()
