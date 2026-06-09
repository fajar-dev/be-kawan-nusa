import { AppDataSource } from "../config/database"
import { NisDataSource } from "../config/nis-database"
import { User } from "../modules/user/entities/user.entity"

/**
 * Sync users from NIS database.
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

    // Deduplicate: for duplicate emails/phones, keep active user, null out the rest
    const emailSeen = new Map<string, any>()
    const phoneSeen = new Map<string, any>()

    // Sort: active users first so they take priority
    const sorted = [...sourceRows].sort((a, b) => (b.is_active ?? 0) - (a.is_active ?? 0))

    for (const row of sorted) {
        const email = row.email?.trim().toLowerCase() || null
        const phone = row.phone ? row.phone.replace(/\D/g, '').replace(/^62/, '0') : null

        if (email && emailSeen.has(email)) {
            row._email = null // duplicate, null it out
        } else {
            row._email = email
            if (email) emailSeen.set(email, row)
        }

        if (phone && phoneSeen.has(phone)) {
            row._phone = null // duplicate, null it out
        } else {
            row._phone = phone
            if (phone) phoneSeen.set(phone, row)
        }
    }

    let synced = 0
    let skipped = 0

    for (const row of sorted) {
        try {
            await repo.upsert({
                id: row.id,
                firstName: row.first_name || '',
                lastName: row.last_name || '',
                phone: row._phone,
                email: row._email,
                company: row.company || null,
                accountNumber: row.account_number || null,
                accountHolderName: row.account_holder_name || null,
                bankName: row.bank_name || null,
                identityNumber: row.identity_number || null,
                isActive: row.is_active === 1,
            }, ["id"])
            synced++
        } catch (error: any) {
            console.warn(`[Sync] Skipped user ID ${row.id}: ${error.message}`)
            skipped++
        }
    }

    console.log(`[Sync] Synced ${synced} users, skipped ${skipped}`)
}

sync()
