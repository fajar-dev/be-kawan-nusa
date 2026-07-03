import { DataSource } from "typeorm"
import { AppDataSource } from "../../config/database"
import { Customer } from "../../modules/customer/entities/customer.entity"
import { CustomerPhone } from "../../modules/customer/entities/customer-phone.entity"
import { CustomerEmail } from "../../modules/customer/entities/customer-email.entity"
import { CustomerService } from "../../modules/customer-service/entities/customer-service.entity"
import { CustomerServiceReferral } from "../../modules/customer-service/entities/customer-service-referral.entity"
import { Service } from "../../modules/service/entities/service.entity"
import { Employee } from "../../modules/employee/entities/employee.entity"
import { CustomerType } from "../../modules/customer/customer.enum"
import { CustomerServiceStatus } from "../../modules/customer-service/customer-service.enum"
import { ServiceType, ServiceCategory } from "../../modules/service/service.enum"
import { config } from "../../config/config"

export interface NisAccountResult {
    custServId: number
    custId: string
    accountName: string
    serviceCode: string
    serviceName: string
    accountManager: string | null
    salesEmployeeId: string | null
}

export class NisHelper {
    private nisDataSource: DataSource | null = null

    /**
     * Lazy-initialize the NIS database connection.
     * Reuses the connection if already initialized.
     */
    private async getConnection(): Promise<DataSource> {
        if (this.nisDataSource && this.nisDataSource.isInitialized) {
            return this.nisDataSource
        }

        this.nisDataSource = new DataSource({
            type: "mysql",
            host: config.nis.host,
            port: config.nis.port,
            username: config.nis.user,
            password: config.nis.pass,
            database: config.nis.name,
            synchronize: false,
            entities: [],
            connectorPackage: "mysql2",
            charset: "utf8mb4_unicode_ci",
        })

        await this.nisDataSource.initialize()
        return this.nisDataSource
    }

    /**
     * Search customer service accounts from NIS database.
     * Searches by account name (CustAccName) or customer ID (CustId).
     */
    async searchAccounts(q: string, limit: number = 10): Promise<NisAccountResult[]> {
        const nis = await this.getConnection()

        const rows: any[] = await nis.query(`
            SELECT 
                cs.CustServId AS custServId,
                cs.CustId AS custId,
                cs.CustAccName AS accountName,
                cs.ServiceId AS serviceCode,
                s.serviceType AS serviceName,
                cs.SalesId AS salesEmployeeId
            FROM CustomerServices cs
            LEFT JOIN Services s ON cs.ServiceId = s.ServiceId
            WHERE (cs.CustAccName LIKE ? OR cs.CustId LIKE ?)
              AND cs.CustStatus = 'AC'
            ORDER BY cs.CustAccName ASC
            LIMIT ?
        `, [`%${q}%`, `%${q}%`, limit])

        if (rows.length === 0) return []

        // Lookup account managers from local Employee table
        const salesIds = Array.from(new Set(rows.map(r => r.salesEmployeeId).filter(Boolean)))
        const employeeMap = new Map<string, string>()

        if (salesIds.length > 0) {
            const employeeRepo = AppDataSource.getRepository(Employee)
            const employees = await employeeRepo
                .createQueryBuilder("e")
                .where("e.employeeId IN (:...salesIds)", { salesIds: salesIds.map(String) })
                .getMany()

            for (const emp of employees) {
                employeeMap.set(emp.employeeId, emp.name)
            }
        }

        return rows.map(row => ({
            custServId: row.custServId,
            custId: row.custId,
            accountName: row.accountName || '',
            serviceCode: row.serviceCode || '',
            serviceName: row.serviceName || '',
            accountManager: row.salesEmployeeId ? (employeeMap.get(String(row.salesEmployeeId)) || null) : null,
            salesEmployeeId: row.salesEmployeeId ? String(row.salesEmployeeId) : null,
        }))
    }

    /**
     * Sync a specific customer service account from NIS to local database.
     * All local writes are wrapped in a single transaction for data integrity.
     * Creates/updates Customer, Service, CustomerService, CustomerPhone, and CustomerEmail records.
     * Returns the local customerServiceId for point creation.
     */
    async syncAccountToLocal(
        custServId: number,
        userId: number
    ): Promise<{ customerId: string; customerServiceId: number } | null> {
        const nis = await this.getConnection()

        // Fetch full account details from NIS (read from external DB — outside transaction)
        const rows: any[] = await nis.query(`
            SELECT
                cs.CustServId AS id,
                cs.CustId AS customerId,
                cs.ServiceId AS serviceCode,
                cs.CustAccName AS accountName,
                cs.CustRegDate AS registrationDate,
                cs.CustActivationDate AS activationDate,
                cs.installation_address AS address,
                cs.SalesId AS salesEmployeeId,
                STR_TO_DATE(CONCAT('01', cs.InvoicePeriod), '%d%m%y') AS startDate,
                cs.ContractUntil AS endDate,
                cs.CustStatus AS custStatus,
                c.CustName AS customerName,
                c.CustCompany AS customerCompany,
                b.BusType AS customerType,
                c.CustStatus AS customerStatus,
                c.CustRegDate AS customerRegDate,
                s.serviceType AS serviceName,
                sgt.description AS serviceType,
                CASE 
                    WHEN s.ServiceCategory = 'access_business' THEN 'Access Business'
                    WHEN s.ServiceCategory = 'access_home' THEN 'Access Home'
                    WHEN s.ServiceCategory = 'digital_business' THEN 'Digital Business'
                    ELSE 'Other'
                END AS serviceCategory
            FROM CustomerServices cs
            LEFT JOIN Customer c ON cs.CustId = c.CustId
            LEFT JOIN Business b ON c.BusId = b.BusId
            LEFT JOIN Services s ON cs.ServiceId = s.ServiceId
            LEFT JOIN ServiceGroup sg ON s.ServiceGroup = sg.ServiceGroup
            LEFT JOIN ServiceGroupType sgt ON sg.ServiceGroupTypeId = sgt.id
            WHERE cs.CustServId = ?
            LIMIT 1
        `, [custServId])

        if (rows.length === 0) return null
        const row = rows[0]

        // Fetch phones and emails from NIS (read from external DB — outside transaction)
        const phoneRows: any[] = await nis.query(`
            SELECT sp.id, sp.custId AS customer_id, sp.phone AS phone, sp.name AS label  
            FROM sms_phonebook sp
            WHERE sp.custId = ?
        `, [row.customerId])

        const emailRows: any[] = await nis.query(`
            SELECT cve.id, cve.cust_id AS customer_id, cve.cust_email AS email, cve.email_type AS label  
            FROM CustomerVerifiedEmail cve
            WHERE cve.cust_id = ?
        `, [row.customerId])

        // All local DB writes in a single transaction
        return await AppDataSource.transaction(async (manager) => {
            // 1. Upsert Service
            const typeVals = Object.values(ServiceType) as string[]
            let typeEnum = ServiceType.INTERNET
            if (row.serviceType && typeVals.includes(row.serviceType)) {
                typeEnum = row.serviceType as ServiceType
            }

            let categoryEnum = ServiceCategory.ACCESS_BUSINESS
            if (row.serviceCategory === 'Access Home') categoryEnum = ServiceCategory.ACCESS_HOME
            else if (row.serviceCategory === 'Digital Business') categoryEnum = ServiceCategory.DIGITAL_BUSINESS

             // 1. Sync Service (Find or Create by code)
            try {
                let service = await manager.getRepository(Service).findOneBy({ code: row.serviceCode })
                if (service) {
                    // Update existing
                    await manager.getRepository(Service).update(service.id, {
                        name: row.serviceName || 'Unknown',
                        type: typeEnum,
                        category: categoryEnum,
                        isActive: true,
                    })
                } else {
                    // Create new
                    service = manager.create(Service, {
                        code: row.serviceCode,
                        name: row.serviceName || 'Unknown',
                        type: typeEnum,
                        category: categoryEnum,
                        isActive: true,
                    })
                    await manager.save(service)
                }
            } catch (err: any) {
                console.error(`[NisHelper] Sync Service failed: ${err.message}`)
                throw err
            }

             // 2. Upsert Customer
            const custTypeVals = Object.values(CustomerType) as string[]
            let custTypeEnum: CustomerType | undefined = undefined
            if (row.customerType && custTypeVals.includes(row.customerType)) {
                custTypeEnum = row.customerType as CustomerType
            } else if (row.customerType) {
                custTypeEnum = CustomerType.OTHERS
            }

            await manager.getRepository(Customer).upsert({
                id: row.customerId,
                name: row.customerName || 'Unknown',
                company: row.customerCompany || null,
                type: custTypeEnum,
                registrationDate: row.customerRegDate || null,
                isActive: row.customerStatus === 'AC',
            }, ["id"])

            // 3. Sync customer phones
            for (const phoneRow of phoneRows) {
                const phone = phoneRow.phone || ''
                if (!phone) continue
                try {
                    await manager.getRepository(CustomerPhone).upsert({
                        id: phoneRow.id,
                        customerId: phoneRow.customer_id,
                        phone: phone,
                        label: phoneRow.label || 'Phone'
                    }, ["id"])
                } catch (err) {
                    console.warn(`[NisHelper] Skipped phone ID ${phoneRow.id} for customer ${row.customerId}`)
                }
            }

            // 4. Sync customer emails
            for (const emailRow of emailRows) {
                const email = emailRow.email || ''
                if (!email) continue
                try {
                    await manager.getRepository(CustomerEmail).upsert({
                        id: emailRow.id,
                        customerId: emailRow.customer_id,
                        email: email.trim().toLowerCase(),
                        label: emailRow.label || 'Email'
                    }, ["id"])
                } catch (err) {
                    console.warn(`[NisHelper] Skipped email ID ${emailRow.id} failed for customer ${row.customerId}`)
                }
            }

            // 5. Lookup salesId from local Employee table
            let salesId: number | null = null
            if (row.salesEmployeeId) {
                const employee = await manager.getRepository(Employee).findOne({
                    where: { employeeId: String(row.salesEmployeeId) }
                })
                if (employee) salesId = employee.id
            }

            // 6. Upsert CustomerService
            let statusEnum = CustomerServiceStatus.AC
            if (row.custStatus === 'NA') statusEnum = CustomerServiceStatus.NA
            else if (row.custStatus === 'BL') statusEnum = CustomerServiceStatus.BL
            else if (row.custStatus === 'FR') statusEnum = CustomerServiceStatus.FR

            await manager.getRepository(CustomerService).upsert({
                id: row.id,
                customerId: row.customerId,
                serviceCode: row.serviceCode,
                accountName: row.accountName || null,
                registrationDate: row.registrationDate,
                activationDate: row.activationDate || null,
                address: row.address || null,
                startDate: row.startDate || null,
                endDate: row.endDate || null,
                referenceDate: row.registrationDate,
                salesId: salesId,
                status: statusEnum,
            }, ["id"])

            // 7. Upsert CustomerServiceReferral (pivot table)
            await manager.getRepository(CustomerServiceReferral).upsert({
                customerServiceId: row.id,
                userId: userId,
            }, ["customerServiceId", "userId"])

            return {
                customerId: row.customerId,
                customerServiceId: row.id,
            }
        })
    }
}
