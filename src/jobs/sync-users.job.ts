import { AppDataSource } from "../config/database"
import { NisDataSource } from "../config/nis-database"
import { User } from "../modules/user/entities/user.entity"
import { UserStatus } from "../modules/user/user.enum"

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
                WHEN r.Status = 'AC' THEN 'active'
                WHEN r.Status = 'NA' THEN 'inactive'
                ELSE 'inactive'
            END AS status
        FROM Reseller r
    `)

    if (sourceRows.length === 0) {
        console.log("[Sync] No users found in source")
        return
    }

    const repo = AppDataSource.getRepository(User)

    // Fetch all existing users from local DB to avoid unique constraint conflicts
    const existingUsers = await repo.find({ select: ["id", "email", "phone"] })
    const existingEmailMap = new Map<string, number>()
    const existingPhoneMap = new Map<string, number>()

    for (const u of existingUsers) {
        if (u.email) existingEmailMap.set(u.email, u.id)
        if (u.phone) existingPhoneMap.set(u.phone, u.id)
    }

    // Deduplicate: for duplicate emails/phones, keep active user, null out the rest
    const emailSeen = new Map<string, any>()
    const phoneSeen = new Map<string, any>()

    // Sort: active users first so they take priority
    const sorted = [...sourceRows].sort((a, b) => (b.status === 'active' ? 1 : 0) - (a.status === 'active' ? 1 : 0))

    for (const row of sorted) {
        let email = row.email?.trim().toLowerCase() || null
        if (email === "") email = null
        
        let phone = row.phone ? row.phone.replace(/\D/g, '').replace(/^62/, '0') : null
        if (phone === "") phone = null

        row._email = email
        row._phone = phone

        // Check if email is already owned by ANOTHER user in the local database
        if (row._email) {
            const ownerId = existingEmailMap.get(row._email)
            if (ownerId !== undefined && ownerId !== row.id) {
                row._email = null
            }
        }

        // Check if phone is already owned by ANOTHER user in the local database
        if (row._phone) {
            const ownerId = existingPhoneMap.get(row._phone)
            if (ownerId !== undefined && ownerId !== row.id) {
                row._phone = null
            }
        }

        // Check against duplicates WITHIN the current sync batch
        if (row._email && emailSeen.has(row._email)) {
            row._email = null
        } else if (row._email) {
            emailSeen.set(row._email, row)
        }

        if (row._phone && phoneSeen.has(row._phone)) {
            row._phone = null
        } else if (row._phone) {
            phoneSeen.set(row._phone, row)
        }
    }

    let synced = 0
    let skipped = 0

    for (const row of sorted) {
        try {
            await repo.createQueryBuilder()
                .insert()
                .into(User)
                .values({
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
                    status: row.status === 'active' ? UserStatus.ACTIVE : UserStatus.INACTIVE,
                    isVerified: true,
                    isBoarding: false,
                })
                .orUpdate(["status", "is_verified", "is_boarding"], ["id"])
                .execute()
            synced++
        } catch (error: any) {
            console.warn(`[Sync] Skipped user ID ${row.id}: ${error.message}`)
            skipped++
        }
    }

    console.log(`[Sync] Synced ${synced} users, skipped ${skipped}`)
}

sync()
