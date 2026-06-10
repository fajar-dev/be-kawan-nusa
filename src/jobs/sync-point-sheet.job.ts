import { AppDataSource } from "../config/database"
import { GoogleSheetsHelper } from "../core/helpers/sheets.helper"
import { Reward } from "../modules/reward/entities/reward.entity"
import { CustomerService } from "../modules/customer-service/entities/customer-service.entity"
import { RewardPointType } from "../modules/reward/reward.enum"

/**
 * Helper to parse Month and Year from tab title (e.g. "Jun'26")
 * and returns a Date object set to the 15th of that month.
 */
function parseDateFromTitle(title: string): Date {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"]
    const now = new Date()
    
    // Find the month index
    let foundMonthIndex = -1
    for (let i = 0; i < months.length; i++) {
        if (title.toLowerCase().includes(months[i].toLowerCase())) {
            foundMonthIndex = i
            break
        }
    }
    
    // Find year suffix like '26 or 2026 or 26.
    let year = now.getFullYear()
    const yearMatch = title.match(/'(\d{2})/)
    if (yearMatch) {
        year = 2000 + parseInt(yearMatch[1], 10)
    } else {
        // Fallback: search for any 2 or 4 digit numbers in the title
        const anyYearMatch = title.match(/\b(20\d{2}|\d{2})\b/)
        if (anyYearMatch) {
            const yr = parseInt(anyYearMatch[1], 10)
            year = yr < 100 ? 2000 + yr : yr
        }
    }
    
    const month = foundMonthIndex !== -1 ? foundMonthIndex : now.getMonth()
    
    return new Date(year, month, 15, 12, 0, 0)
}

/**
 * Sync data from Google Sheets to Application Database
 * Run: bun run sync-sheets
 */
async function sync() {
    try {
        console.log("[Sync GSheets] Starting Google Sheets sync...")
        const startTime = Date.now()

        // 1. Initialize Database connection
        await AppDataSource.initialize()
        console.log("[Sync GSheets] App database connected")

        // 2. Initialize Google Sheets Helper
        const sheetsHelper = new GoogleSheetsHelper()

        console.log("[Sync GSheets] Connecting to Google Sheets...")
        await sheetsHelper.loadInfo()
        console.log(`[Sync GSheets] Connected to document: "${sheetsHelper.title}"`)

        const args = process.argv.slice(2)
        const isCurrentMonth = args.includes('--current')

        const allTitles = await sheetsHelper.getAllSheetTitles()
        let targetTitles = allTitles

        if (isCurrentMonth) {
            const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"]
            const now = new Date()
            const currentStr = `${months[now.getMonth()]}'${now.getFullYear().toString().substring(2)}`
            targetTitles = allTitles.filter(t => t.includes(currentStr))
            console.log(`[Sync GSheets] Filtering tabs for current month: "${currentStr}"`)
        } else {
            console.log(`[Sync GSheets] Processing ALL tabs`)
        }

        if (targetTitles.length === 0) {
            console.log("[Sync GSheets] No tabs found matching the criteria.")
            process.exit(0)
        }

        let totalProcessed = 0
        const rewardRepo = AppDataSource.getRepository(Reward)
        const csRepo = AppDataSource.getRepository(CustomerService)

        for (const title of targetTitles) {
            console.log(`\n[Sync GSheets] --- Processing Tab: "${title}" ---`)
            const rawRows = await sheetsHelper.getRawRowsByTitle(title)
            console.log(`[Sync GSheets] Fetched ${rawRows.length} rows from "${title}"`)

            if (rawRows.length === 0) continue

            // Parse date for the current tab once
            const tabDate = parseDateFromTitle(title)
            const expiredDate = new Date(tabDate)
            expiredDate.setFullYear(tabDate.getFullYear() + 1)

            // Proses data menjadi object { a, b, c, ... }
            const mappedData = rawRows.map(row => {
                const obj: Record<string, any> = {}
                for (let i = 0; i < row.length; i++) {
                    const key = String.fromCharCode(97 + i)
                    obj[key] = row[i]
                }
                return obj
            })

            let tabProcessed = 0

            for (const row of mappedData) {
                if (Object.keys(row).length === 0) continue

                const accountName = row.d?.trim()
                if (!accountName || accountName.toLowerCase() === 'account name') continue // Skip empty or literal header

                const cs = await csRepo.findOne({ where: { accountName } })
                if (!cs) {
                    console.log(`[Sync GSheets] Skipped: Account Name "${accountName}" not found in customer_services`)
                    continue
                }

                const priceRaw = row.g
                let price = 0
                if (typeof priceRaw === 'string') {
                    price = Number(priceRaw.replace(/[^0-9.-]+/g, ""))
                } else if (typeof priceRaw === 'number') {
                    price = priceRaw
                }

                if (isNaN(price)) price = 0
                if (price === 0) continue

                const point = price / 1000

                const typeRaw = row.h
                let typeEnum = RewardPointType.BULANAN // Default
                if (typeRaw) {
                    const matched = Object.values(RewardPointType).find(v => v.toLowerCase() === String(typeRaw).toLowerCase())
                    if (matched) typeEnum = matched as RewardPointType
                }

                const reward = rewardRepo.create({
                    customerService: cs,
                    price,
                    point,
                    type: typeEnum,
                    createdAt: tabDate,
                    expiredDate: expiredDate,
                })

                await rewardRepo.save(reward)
                tabProcessed++
            }
            
            console.log(`[Sync GSheets] Successfully saved ${tabProcessed} rewards from "${title}"`)
            totalProcessed += tabProcessed
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`\n[Sync GSheets] Completed. Processed total ${totalProcessed} rewards across ${targetTitles.length} tabs in ${duration}s`)

        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        console.error("[Sync GSheets] Failed:", error)
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy()
        }
        process.exit(1)
    }
}

sync()
