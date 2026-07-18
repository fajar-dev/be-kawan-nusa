import { AppDataSource } from "../config/database"
import { NisDataSource } from "../config/nis-database"
import { Customer } from "../modules/customer/entities/customer.entity"
import { CustomerPhone } from "../modules/customer/entities/customer-phone.entity"
import { CustomerEmail } from "../modules/customer/entities/customer-email.entity"
import { CustomerService } from "../modules/customer-service/entities/customer-service.entity"
import { CustomerType } from "../modules/customer/customer.enum"
import { CustomerServiceStatus } from "../modules/customer-service/customer-service.enum"
import { Employee } from "../modules/employee/entities/employee.entity"
import { logger } from "../core/helpers/logger"

const JOB = "refresh-customers"
const BATCH = 300

/**
 * Refresh Existing Customers Job
 *
 * Runs daily. Re-pulls fresh data from NIS for the customers & customer-services
 * that ALREADY exist in the local DB (keyed by local IDs — it does not import new
 * customers; those arrive on demand via point-submission approval).
 *
 * Phones and emails are RECONCILED, not just upserted: for each customer that
 * still exists in NIS, local rows that no longer exist in NIS are DELETED, and
 * current NIS rows are upserted — so contacts stay accurate as they are added or
 * removed upstream. Customers not found in NIS are left untouched (never wiped).
 *
 * Usage: bun run refresh-customers
 */

function groupBy<T>(rows: T[], key: (r: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>()
    for (const r of rows) {
        const k = key(r)
        const arr = map.get(k)
        if (arr) arr.push(r)
        else map.set(k, [r])
    }
    return map
}

async function refreshCustomers() {
    const customerRepo = AppDataSource.getRepository(Customer)
    const phoneRepo = AppDataSource.getRepository(CustomerPhone)
    const emailRepo = AppDataSource.getRepository(CustomerEmail)

    const localIds = (await customerRepo.find({ select: { id: true } })).map(c => c.id)
    logger.info("Refreshing customers", { job: JOB, total: localIds.length })

    let updated = 0, notInNis = 0
    let phonesUpserted = 0, phonesRemoved = 0
    let emailsUpserted = 0, emailsRemoved = 0

    for (let i = 0; i < localIds.length; i += BATCH) {
        const batchIds = localIds.slice(i, i + BATCH)
        const ph = batchIds.map(() => "?").join(",")

        // 1. Fresh customer data from NIS
        const custRows: any[] = await NisDataSource.query(`
            SELECT c.CustId AS id, c.CustName AS name, c.CustCompany AS company,
                   b.BusType AS type, c.CustRegDate AS registration_date,
                   CASE WHEN c.CustStatus = 'AC' THEN 1 ELSE 0 END AS is_active
            FROM Customer c LEFT JOIN Business b ON c.BusId = b.BusId
            WHERE c.CustId IN (${ph})
        `, batchIds)

        const foundIds = custRows.map(r => r.id)
        notInNis += batchIds.length - foundIds.length
        if (foundIds.length === 0) continue

        // Update customer fields
        for (const row of custRows) {
            const typeVals = Object.values(CustomerType) as string[]
            let typeEnum: CustomerType | undefined = undefined
            if (row.type && typeVals.includes(row.type)) typeEnum = row.type as CustomerType
            else if (row.type) typeEnum = CustomerType.OTHERS

            await customerRepo.update(row.id, {
                name: row.name || 'Unknown',
                company: row.company || null,
                type: typeEnum,
                registrationDate: row.registration_date || null,
                isActive: row.is_active === 1,
            })
            updated++
        }

        // 2. Fresh phones & emails for the customers that still exist in NIS
        const fph = foundIds.map(() => "?").join(",")
        const phoneRows: any[] = await NisDataSource.query(`
            SELECT sp.id, sp.custId AS customer_id, sp.phone AS phone, sp.name AS label
            FROM sms_phonebook sp WHERE sp.custId IN (${fph})
        `, foundIds)
        const emailRows: any[] = await NisDataSource.query(`
            SELECT cve.id, cve.cust_id AS customer_id, cve.cust_email AS email, cve.email_type AS label
            FROM CustomerVerifiedEmail cve WHERE cve.cust_id IN (${fph})
        `, foundIds)

        const phonesByCust = groupBy(phoneRows.filter(r => r.phone), r => String(r.customer_id))
        const emailsByCust = groupBy(emailRows.filter(r => r.email), r => String(r.customer_id))

        // 3. Reconcile per customer (delete removed → upsert current)
        for (const cid of foundIds) {
            // ── phones ──
            const phones = phonesByCust.get(String(cid)) || []
            const phoneIds = phones.map(p => p.id)
            const delPhones = phoneRepo.createQueryBuilder().delete().where("customer_id = :cid", { cid })
            if (phoneIds.length) delPhones.andWhere("id NOT IN (:...ids)", { ids: phoneIds })
            phonesRemoved += (await delPhones.execute()).affected || 0
            if (phones.length) {
                await phoneRepo.upsert(
                    phones.map(p => ({ id: p.id, customerId: p.customer_id, phone: p.phone, label: p.label || 'Phone' })),
                    ["id"]
                )
                phonesUpserted += phones.length
            }

            // ── emails ──
            const emails = emailsByCust.get(String(cid)) || []
            const emailIds = emails.map(e => e.id)
            const delEmails = emailRepo.createQueryBuilder().delete().where("customer_id = :cid", { cid })
            if (emailIds.length) delEmails.andWhere("id NOT IN (:...ids)", { ids: emailIds })
            emailsRemoved += (await delEmails.execute()).affected || 0
            if (emails.length) {
                await emailRepo.upsert(
                    emails.map(e => ({ id: e.id, customerId: e.customer_id, email: String(e.email).trim().toLowerCase(), label: e.label || 'Email' })),
                    ["id"]
                )
                emailsUpserted += emails.length
            }
        }
    }

    return { customersUpdated: updated, customersNotInNis: notInNis, phonesUpserted, phonesRemoved, emailsUpserted, emailsRemoved }
}

async function refreshCustomerServices() {
    const csRepo = AppDataSource.getRepository(CustomerService)

    // Preload employees for sales lookup
    const employees = await AppDataSource.getRepository(Employee).find()
    const employeeMap = new Map<string, number>()
    for (const e of employees) employeeMap.set(e.employeeId, e.id)

    const localIds = (await csRepo.find({ select: { id: true } })).map(c => c.id)
    logger.info("Refreshing customer services", { job: JOB, total: localIds.length })

    let updated = 0, notInNis = 0

    for (let i = 0; i < localIds.length; i += BATCH) {
        const batchIds = localIds.slice(i, i + BATCH)
        const ph = batchIds.map(() => "?").join(",")

        const rows: any[] = await NisDataSource.query(`
            SELECT cs.CustServId AS id, cs.CustAccName AS account_name,
                   cs.CustActivationDate AS activation_date, cs.installation_address AS address,
                   cs.SalesId AS sales_employee_id,
                   STR_TO_DATE(CONCAT('01', cs.InvoicePeriod), '%d%m%y') AS start_date,
                   cs.ContractUntil AS end_date,
                   CASE
                       WHEN cs.CustStatus = 'AC' THEN 'Active'
                       WHEN cs.CustStatus = 'NA' THEN 'Non Active'
                       WHEN cs.CustStatus = 'BL' THEN 'Block'
                       WHEN cs.CustStatus = 'FR' THEN 'Free'
                       ELSE NULL
                   END AS status
            FROM CustomerServices cs
            WHERE cs.CustServId IN (${ph})
        `, batchIds)

        const foundIds = new Set(rows.map(r => r.id))
        notInNis += batchIds.length - foundIds.size

        for (const row of rows) {
            let statusEnum = CustomerServiceStatus.AC
            if (row.status === 'Non Active') statusEnum = CustomerServiceStatus.NA
            else if (row.status === 'Block') statusEnum = CustomerServiceStatus.BL
            else if (row.status === 'Free') statusEnum = CustomerServiceStatus.FR

            const salesId = row.sales_employee_id ? (employeeMap.get(String(row.sales_employee_id)) ?? null) : null

            await csRepo.update(row.id, {
                accountName: row.account_name || null,
                activationDate: row.activation_date || null,
                address: row.address || null,
                startDate: row.start_date || null,
                endDate: row.end_date || null,
                salesId,
                status: statusEnum,
            })
            updated++
        }
    }

    return { customerServicesUpdated: updated, customerServicesNotInNis: notInNis }
}

async function run() {
    try {
        logger.info("Job started", { job: JOB })
        const startTime = Date.now()

        await AppDataSource.initialize()
        await NisDataSource.initialize()
        logger.info("Databases connected", { job: JOB })

        const customerStats = await refreshCustomers()
        const serviceStats = await refreshCustomerServices()

        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        logger.info("Job completed", { job: JOB, durationSeconds: Number(duration), ...customerStats, ...serviceStats })

        await NisDataSource.destroy()
        await AppDataSource.destroy()
        process.exit(0)
    } catch (error) {
        logger.error("Job fatal error", { job: JOB, error: (error as Error)?.message, stack: (error as Error)?.stack })
        process.exit(1)
    }
}

run()
