import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, createTestAdminNoPermissions, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { AppDataSource } from "../../src/config/database"
import { Service } from "../../src/modules/service/entities/service.entity"
import { Branch } from "../../src/modules/branch/entities/branch.entity"
import { Customer } from "../../src/modules/customer/entities/customer.entity"
import { CustomerService } from "../../src/modules/customer-service/entities/customer-service.entity"
import { CustomerServiceReferral } from "../../src/modules/customer-service/entities/customer-service-referral.entity"
import { Redemption } from "../../src/modules/redemption/entities/redemption.entity"
import { RedemptionWithdraw } from "../../src/modules/redemption/entities/redemption-withdraw.entity"
import { RedemptionType, RedemptionStatus } from "../../src/modules/redemption/redemption.enum"
import { PointSubmission } from "../../src/modules/point-submission/entities/point-submission.entity"
import { PointSubmissionStatus } from "../../src/modules/point-submission/point-submission.enum"
import { Point } from "../../src/modules/point/entities/point.entity"
import { PointType } from "../../src/modules/point/point.enum"
import { RateCommission } from "../../src/modules/rate-commission/entities/rate-commission.entity"
import { RateCommissionValueType } from "../../src/modules/rate-commission/rate-commission.enum"
import { ReportDownloadHistory } from "../../src/modules/report/entities/report-download-history.entity"

describe("Report Module", () => {
    let referralUser: User
    let testAdmin: Employee
    let noPermAdmin: Employee
    let userToken: string
    let adminToken: string
    let noPermToken: string

    let branch: Branch
    let service: Service
    let customer: Customer
    let customerService: CustomerService

    beforeAll(async () => {
        referralUser = await createTestUser()
        testAdmin = await createTestAdmin()
        noPermAdmin = await createTestAdminNoPermissions()
        userToken = await generateUserToken(referralUser)
        adminToken = await generateAdminToken(testAdmin)
        noPermToken = await generateAdminToken(noPermAdmin)

        branch = await AppDataSource.getRepository(Branch).save({
            code: `RPT-BR-${Date.now()}`,
            name: "Medan",
        })
        service = await AppDataSource.getRepository(Service).save({
            code: `RPT-SVC-${Date.now()}`,
            name: "Internet Report Test",
        })
        customer = await AppDataSource.getRepository(Customer).save({
            id: `RPT-CUST-${Date.now()}`,
            name: "PT Report Test",
            branchCode: branch.code,
            isActive: true,
        })
        customerService = await AppDataSource.getRepository(CustomerService).save({
            customerId: customer.id,
            serviceCode: service.code,
            accountName: "PT Report Test",
            registrationDate: new Date(),
            activationDate: new Date(),
            startDate: new Date(),
        })
        await AppDataSource.getRepository(CustomerServiceReferral).save({
            customerServiceId: customerService.id,
            userId: referralUser.id,
        })

        await AppDataSource.getRepository(RateCommission).save({
            serviceCode: service.code,
            category: PointType.OTC,
            value: 50000,
            type: RateCommissionValueType.FLAT,
            startDate: new Date("2020-01-01"),
            createdById: testAdmin.id,
        })

        const withdraw = await AppDataSource.getRepository(RedemptionWithdraw).save({
            bankName: "BCA",
            accountNumber: "1234567890",
            accountHolderName: "Test User",
            payout: 97500,
            tax: 2500,
        })
        await AppDataSource.getRepository(Redemption).save({
            redempNo: `RPT-RED-${Date.now()}`,
            userId: referralUser.id,
            pointsUsed: 100,
            type: RedemptionType.CASH,
            status: RedemptionStatus.COMPLETED,
            redemptionWithdrawId: withdraw.id,
        })

        await AppDataSource.getRepository(PointSubmission).save({
            userId: referralUser.id,
            type: PointType.OTC,
            point: 50,
            price: 1000000,
            nisData: {
                custServId: customerService.id,
                custId: customer.id,
                accountName: customer.name,
                serviceCode: service.code,
                serviceName: service.name,
                accountManager: "Test AM",
                salesEmployeeId: null,
            },
            status: PointSubmissionStatus.APPROVED,
            createdById: testAdmin.id,
            approvedById: testAdmin.id,
            approvedAt: new Date(),
        })

        await AppDataSource.getRepository(Point).save({
            customerServiceId: customerService.id,
            userId: referralUser.id,
            price: 1000000,
            point: 50,
            expiredDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            remainingPoint: 50,
            type: PointType.OTC,
        })
    })

    afterAll(async () => {
        await AppDataSource.getRepository(ReportDownloadHistory).delete({ requestedById: testAdmin.id })
        await AppDataSource.getRepository(Point).delete({ userId: referralUser.id })
        await AppDataSource.getRepository(PointSubmission).delete({ userId: referralUser.id })
        await AppDataSource.getRepository(Redemption).delete({ userId: referralUser.id })
        await AppDataSource.getRepository(CustomerServiceReferral).delete({ userId: referralUser.id })
        await AppDataSource.getRepository(CustomerService).delete({ customerId: customer.id })
        await AppDataSource.getRepository(RateCommission).delete({ serviceCode: service.code })
        await AppDataSource.getRepository(Customer).delete({ id: customer.id })
        await AppDataSource.getRepository(Service).delete({ id: service.id })
        await AppDataSource.getRepository(Branch).delete({ id: branch.id })
        await cleanupTestUser(referralUser.id)
        await cleanupTestAdmin(testAdmin.id)
        await cleanupTestAdmin(noPermAdmin.id)
    })

    describe("GET /report/preview", () => {
        it("rejects a request with no admin permission", async () => {
            const res = await authRequest("/report/preview?type=cash_redemption", noPermToken)
            expect(res.status).toBe(403)
        })

        it("rejects a non-admin user", async () => {
            const res = await authRequest("/report/preview?type=cash_redemption", userToken)
            expect(res.status).toBe(403)
        })

        it("rejects an unknown report type", async () => {
            const res = await authRequest("/report/preview?type=not_a_type", adminToken)
            expect(res.status).toBe(422)
        })

        it("previews the cash redemption report with branch and tax derived correctly", async () => {
            const res = await authRequest(`/report/preview?type=cash_redemption&branchCode=${branch.code}`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            const row = res.body.data.rows.find((r: any) => r.namaReferral.includes(referralUser.firstName))
            expect(row).toBeTruthy()
            expect(row.cabang).toBe("Medan")
            expect(row.statusTransfer).toBe("Sudah di Transfer")
            expect(row.tarifPph).toBe(0.025)
            expect(row.nominalBruto).toBe(100000)
            expect(row.nilaiPajak).toBe(2500)
            expect(row.nominalNetto).toBe(97500)
        })

        it("previews the product/voucher report", async () => {
            const res = await authRequest("/report/preview?type=product_voucher_redemption", adminToken)
            expect(res.status).toBe(200)
            expect(Array.isArray(res.body.data.rows)).toBe(true)
            expect(res.body.data.columns.some((c: any) => c.key === "namaItem")).toBe(true)
        })

        it("previews the referral point report with commission derived from rate-commission", async () => {
            const res = await authRequest("/report/preview?type=referral_point", adminToken)
            expect(res.status).toBe(200)
            const row = res.body.data.rows.find((r: any) => r.customerId === customer.id)
            expect(row).toBeTruthy()
            expect(row.cabang).toBe("Medan")
            expect(row.tipeKomisi).toBe("Nominal Tetap")
            expect(row.rateKomisi).toBe(50000)
            expect(row.nilaiKomisi).toBe(50000)
            expect(row.statusPersetujuan).toBe("Sudah Disetujui")
        })

        it("previews the point balance report", async () => {
            // Scoped to our test branch — the shared dev DB has 1000+ active users,
            // and the preview endpoint truncates to 20 rows, so an unscoped call
            // would not reliably surface our seeded user.
            const res = await authRequest(`/report/preview?type=point_balance&branchCode=${branch.code}`, adminToken)
            expect(res.status).toBe(200)
            const row = res.body.data.rows.find((r: any) => r.email === referralUser.email)
            expect(row).toBeTruthy()
            expect(row.cabang).toBe("Medan")
        })
    })

    describe("GET /report/download", () => {
        it("rejects without permission", async () => {
            const res = await authRequest("/report/download?type=cash_redemption&format=xlsx", noPermToken)
            expect(res.status).toBe(403)
        })

        it("streams an xlsx file and logs a download history entry", async () => {
            const res = await authRequest("/report/download?type=cash_redemption&format=xlsx&includeSummary=true", adminToken)
            expect(res.status).toBe(200)
            expect(res.headers.get("content-type")).toContain("spreadsheetml")
            expect(res.headers.get("content-disposition")).toContain(".xlsx")

            const history = await AppDataSource.getRepository(ReportDownloadHistory).findOne({
                where: { requestedById: testAdmin.id, type: "cash_redemption" as any },
                order: { createdAt: "DESC" },
            })
            expect(history).toBeTruthy()
            expect(history?.format).toBe("xlsx" as any)
        })

        it("streams a csv file", async () => {
            const res = await authRequest("/report/download?type=referral_point&format=csv", adminToken)
            expect(res.status).toBe(200)
            expect(res.headers.get("content-type")).toContain("text/csv")
            expect(res.headers.get("content-disposition")).toContain(".csv")
        })
    })

    describe("GET /report/histories", () => {
        it("rejects without permission", async () => {
            const res = await authRequest("/report/histories", noPermToken)
            expect(res.status).toBe(403)
        })

        it("lists past downloads, most recent first", async () => {
            const res = await authRequest("/report/histories?limit=50", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.length).toBeGreaterThan(0)
            expect(res.body.data[0].requestedBy.id).toBe(testAdmin.id)
        })
    })
})
