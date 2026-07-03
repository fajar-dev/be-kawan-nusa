import { AppDataSource } from "../config/database"
import { NisDataSource } from "../config/nis-database"
import { Customer } from "../modules/customer/entities/customer.entity"
import { CustomerPhone } from "../modules/customer/entities/customer-phone.entity"
import { CustomerEmail } from "../modules/customer/entities/customer-email.entity"
import { Service } from "../modules/service/entities/service.entity"
import { CustomerService } from "../modules/customer-service/entities/customer-service.entity"
import { CustomerType } from "../modules/customer/customer.enum"
import { CustomerServiceStatus } from "../modules/customer-service/customer-service.enum"
import { ServiceType, ServiceCategory } from "../modules/service/service.enum"
import { Employee } from "../modules/employee/entities/employee.entity"

/**
 * Sync customers, services, and customer services from NIS database.
 * Run: bun run sync-customers
 */
async function sync() {
    try {
        console.log("[Sync] Starting customers & services sync...")
        const startTime = Date.now()

        await AppDataSource.initialize()
        console.log("[Sync] App database connected")

        await NisDataSource.initialize()
        console.log("[Sync] Source database connected")

        await syncServices()
        await syncCustomers()
        await syncCustomerPhones()
        await syncCustomerEmails()
        await syncCustomerServices()

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

async function syncServices() {
    const sourceRows: any[] = await NisDataSource.query(`
        SELECT 
            s.ServiceId AS code, 
            s.serviceType AS name, 
            sgt.description AS type,
            CASE 
                WHEN s.ServiceCategory = 'access_business' THEN 'Access Business'
                WHEN s.ServiceCategory = 'access_home' THEN 'Access Home'
                WHEN s.ServiceCategory = 'digital_business' THEN 'Digital Business'
                ELSE 'Other'
            END AS category
        FROM Services s
        LEFT JOIN ServiceGroup sg
            ON s.ServiceGroup = sg.ServiceGroup
        LEFT JOIN ServiceGroupType sgt
            ON sg.ServiceGroupTypeId = sgt.id
        WHERE EXISTS (
            SELECT 1 FROM CustomerServices cs
            WHERE cs.ServiceId = s.ServiceId
              AND cs.ResellerType = 'reseller'
              AND cs.ResellerTypeId != 1
              AND cs.ResellerTypeId IS NOT NULL
              AND cs.ResellerTypeId != ''
        );
    `)

    if (sourceRows.length === 0) {
        console.log("[Sync] No services found in source")
        return
    }

    const repo = AppDataSource.getRepository(Service)
    const batchSize = 500
    let synced = 0

    // Deduplicate by code
    const uniqueRows = new Map<string, any>()
    for (const row of sourceRows) {
        if (row.code && !uniqueRows.has(row.code)) {
            uniqueRows.set(row.code, row)
        }
    }

    const sorted = Array.from(uniqueRows.values())

    for (let i = 0; i < sorted.length; i += batchSize) {
        const batch = sorted.slice(i, i + batchSize)
        const entities = batch.map(row => {
            // Mapping category string to enum
            let categoryEnum = ServiceCategory.ACCESS_BUSINESS
            if (row.category === 'Access Home') categoryEnum = ServiceCategory.ACCESS_HOME
            else if (row.category === 'Digital Business') categoryEnum = ServiceCategory.DIGITAL_BUSINESS

            // Try mapping type string to enum if matches exactly, otherwise default
            const typeVals = Object.values(ServiceType) as string[]
            let typeEnum = ServiceType.INTERNET
            if (row.type && typeVals.includes(row.type)) {
                typeEnum = row.type as ServiceType
            }

            return repo.create({
                code: row.code,
                name: row.name || 'Unknown',
                type: typeEnum,
                category: categoryEnum,
                isActive: true, // defaulting to true as not provided
            })
        })

        await repo.createQueryBuilder()
            .insert()
            .into(Service)
            .values(entities)
            .orUpdate(["name", "type", "category", "is_active"], ["code"])
            .updateEntity(false)
            .execute()
        synced += entities.length
    }

    console.log(`[Sync] Synced ${synced} services`)
}

async function syncCustomers() {
    const sourceRows: any[] = await NisDataSource.query(`
        SELECT 
            c.CustId AS id,
            c.CustName AS name,
            c.CustCompany AS company,
            b.BusType AS type,
            c.CustRegDate AS registration_date,
            CASE 
                WHEN c.CustStatus = 'AC' THEN 1
                WHEN c.CustStatus = 'NA' THEN 0
                ELSE 0
            END AS is_active
        FROM Customer c 
        LEFT JOIN Business b
            ON c.BusId = b.BusId
        WHERE EXISTS (
            SELECT 1 FROM CustomerServices cs
            WHERE cs.CustId = c.CustId
              AND cs.ResellerType = 'reseller'
              AND cs.ResellerTypeId != 1
              AND cs.ResellerTypeId IS NOT NULL
              AND cs.ResellerTypeId != ''
        );
    `)

    if (sourceRows.length === 0) {
        console.log("[Sync] No customers found in source")
        return
    }

    const repo = AppDataSource.getRepository(Customer)
    const batchSize = 500
    let synced = 0

    // Deduplicate by id
    const uniqueRows = new Map<string, any>()
    for (const row of sourceRows) {
        if (row.id && !uniqueRows.has(row.id)) {
            uniqueRows.set(row.id, row)
        }
    }

    const sorted = Array.from(uniqueRows.values())

    for (let i = 0; i < sorted.length; i += batchSize) {
        const batch = sorted.slice(i, i + batchSize)
        const entities = batch.map(row => {
            // Map type string to enum if matches exactly, otherwise default
            const typeVals = Object.values(CustomerType) as string[]
            let typeEnum: CustomerType | undefined = undefined
            if (row.type && typeVals.includes(row.type)) {
                typeEnum = row.type as CustomerType
            } else if (row.type) {
                typeEnum = CustomerType.OTHERS
            }

            return repo.create({
                id: row.id,
                name: row.name || 'Unknown',
                company: row.company || null,
                type: typeEnum,
                registrationDate: row.registration_date || null,
                isActive: row.is_active === 1,
            })
        })

        await repo.upsert(entities, ["id"])
        synced += entities.length
    }

    console.log(`[Sync] Synced ${synced} customers`)
}

async function syncCustomerPhones() {
    const sourceRows: any[] = await NisDataSource.query(`
        SELECT sp.id, sp.custId AS customer_id, sp.phone AS phone, sp.name AS label  
        FROM sms_phonebook sp
        WHERE EXISTS (
            SELECT 1 FROM CustomerServices cs
            WHERE cs.CustId = sp.custId
              AND cs.ResellerType = 'reseller'
              AND cs.ResellerTypeId != 1
              AND cs.ResellerTypeId IS NOT NULL
              AND cs.ResellerTypeId != ''
        );
    `)

    if (sourceRows.length === 0) {
        console.log("[Sync] No customer phones found in source")
        return
    }

    const repo = AppDataSource.getRepository(CustomerPhone)
    
    const batchSize = 500
    let synced = 0
    let skipped = 0

    const entitiesToInsert = []
    
    for (const row of sourceRows) {
        if (!row.customer_id) continue
        
        const phone = row.phone || ''
        if (!phone) continue

        entitiesToInsert.push({
            id: row.id,
            customerId: row.customer_id,
            phone: phone,
            label: row.label || 'Phone'
        })
    }

    for (let i = 0; i < entitiesToInsert.length; i += batchSize) {
        const batch = entitiesToInsert.slice(i, i + batchSize)
        try {
            await repo.upsert(batch, ["id"])
            synced += batch.length
        } catch (err: any) {
            // Fallback: upsert individually if FK constraints fail
            for (const item of batch) {
                try {
                    await repo.upsert(item, ["id"])
                    synced++
                } catch (e) {
                    skipped++
                }
            }
        }
    }

    console.log(`[Sync] Synced ${synced} customer phones, skipped ${skipped}`)
}

async function syncCustomerEmails() {
    const sourceRows: any[] = await NisDataSource.query(`
        SELECT cve.id, cve.cust_id AS customer_id, cve.cust_email AS email, cve.email_type AS label  
        FROM CustomerVerifiedEmail cve
        WHERE EXISTS (
            SELECT 1 FROM CustomerServices cs
            WHERE cs.CustId = cve.cust_id
              AND cs.ResellerType = 'reseller'
              AND cs.ResellerTypeId != 1
              AND cs.ResellerTypeId IS NOT NULL
              AND cs.ResellerTypeId != ''
        );
    `)

    if (sourceRows.length === 0) {
        console.log("[Sync] No customer emails found in source")
        return
    }

    const repo = AppDataSource.getRepository(CustomerEmail)
    const batchSize = 500
    let synced = 0
    let skipped = 0

    const entitiesToInsert = []
    
    for (const row of sourceRows) {
        if (!row.customer_id) continue
        
        const email = row.email || ''
        if (!email) continue

        entitiesToInsert.push({
            id: row.id,
            customerId: row.customer_id,
            email: email.trim().toLowerCase(),
            label: row.label || 'Email'
        })
    }

    for (let i = 0; i < entitiesToInsert.length; i += batchSize) {
        const batch = entitiesToInsert.slice(i, i + batchSize)
        try {
            await repo.upsert(batch, ["id"])
            synced += batch.length
        } catch (err: any) {
            for (const item of batch) {
                try {
                    await repo.upsert(item, ["id"])
                    synced++
                } catch (e) {
                    skipped++
                }
            }
        }
    }

    console.log(`[Sync] Synced ${synced} customer emails, skipped ${skipped}`)
}

async function syncCustomerServices() {
    const sourceRows: any[] = await NisDataSource.query(`
        SELECT
            cs.CustServId AS id,
            cs.CustId AS customer_id,
            cs.ServiceId AS service_code,
            cs.ResellerTypeId AS user_id,
            cs.CustRegDate AS registration_date,
            cs.CustActivationDate AS activation_date,
            cs.CustAccName AS account_name,
            cs.installation_address AS address,
            cs.SalesId AS sales_employee_id,
            STR_TO_DATE(CONCAT('01', cs.InvoicePeriod), '%d%m%y') AS start_date,
            cs.ContractUntil AS end_date,
            DATE(cshn_first.insert_time) AS reference_date,
            CASE 
                WHEN cs.CustStatus = 'AC' THEN 'Active'
                WHEN cs.CustStatus = 'NA' THEN 'Non Active'
                WHEN cs.CustStatus = 'BL' THEN 'Block'
                WHEN cs.CustStatus = 'FR' THEN 'Free'
                ELSE NULL
            END AS status
        FROM CustomerServices cs
        LEFT JOIN (
            SELECT cust_serv_id, MIN(insert_time) AS insert_time
            FROM CustomerServicesHistoryNew
            GROUP BY cust_serv_id
        ) cshn_first
            ON cs.CustServId = cshn_first.cust_serv_id
        WHERE cs.ResellerType = 'reseller'
          AND cs.ResellerTypeId != 1
          AND cs.ResellerTypeId IS NOT NULL
          AND cs.ResellerTypeId != ''
        ORDER BY cs.CustRegDate DESC;
    `)

    if (sourceRows.length === 0) {
        console.log("[Sync] No customer_services found in source")
        return
    }

    // Pre-load all employees from local table, keyed by employeeId
    const employeeRepo = AppDataSource.getRepository(Employee)
    const allEmployees = await employeeRepo.find()
    const employeeMap = new Map<string, number>()
    for (const emp of allEmployees) {
        employeeMap.set(emp.employeeId, emp.id)
    }
    console.log(`[Sync] Loaded ${employeeMap.size} employees for sales lookup`)

    const repo = AppDataSource.getRepository(CustomerService)
    const batchSize = 500
    let synced = 0
    let skipped = 0

    // Deduplicate by id
    const uniqueRows = new Map<number, any>()
    for (const row of sourceRows) {
        if (row.id && !uniqueRows.has(row.id)) {
            uniqueRows.set(row.id, row)
        }
    }

    const sorted = Array.from(uniqueRows.values())

    for (let i = 0; i < sorted.length; i += batchSize) {
        const batch = sorted.slice(i, i + batchSize)
        
        // Use individual inserts to gracefully handle missing FK constraints (like missing users/customers/services)
        for (const row of batch) {
            let statusEnum = CustomerServiceStatus.AC
            if (row.status === 'Non Active') statusEnum = CustomerServiceStatus.NA
            else if (row.status === 'Block') statusEnum = CustomerServiceStatus.BL
            else if (row.status === 'Free') statusEnum = CustomerServiceStatus.FR

            // Lookup sales_id from local employees table by employee_id
            const salesId = row.sales_employee_id ? (employeeMap.get(String(row.sales_employee_id)) ?? null) : null

            try {
                await repo.upsert({
                    id: row.id,
                    customerId: row.customer_id,
                    serviceCode: row.service_code,
                    accountName: row.account_name || null,
                    registrationDate: row.registration_date,
                    activationDate: row.activation_date || null,
                    address: row.address || null,
                    startDate: row.start_date || null,
                    endDate: row.end_date || null,
                    referenceDate: row.reference_date || row.registration_date, // fallback to reg date if ref missing
                    salesId: salesId,
                    status: statusEnum,
                }, ["id"])

                // Upsert pivot table (customer_service_referrals)
                if (row.user_id) {
                    await AppDataSource.query(
                        `INSERT IGNORE INTO customer_service_referrals (customer_service_id, user_id) VALUES (?, ?)`,
                        [row.id, row.user_id]
                    )
                }

                synced++
            } catch (err: any) {
                // Ignore FK constraint failures mostly, but log them for debugging
                console.warn(`[Sync] Skipped CS ID ${row.id} (User ID: ${row.user_id}, Customer ID: ${row.customer_id}) - Reason: FK Constraint Failed`)
                skipped++
            }
        }
    }

    console.log(`[Sync] Synced ${synced} customer_services, skipped ${skipped}`)
}

sync()
