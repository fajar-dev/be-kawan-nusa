import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { AppDataSource } from "../../src/config/database"
import { Service } from "../../src/modules/service/entities/service.entity"
import { RateCommission } from "../../src/modules/rate-commission/entities/rate-commission.entity"

describe("Rate Commission Module", () => {
    let testUser: User
    let testAdmin: Employee
    let userToken: string
    let adminToken: string
    let testService: Service
    let otherService: Service

    beforeAll(async () => {
        testUser = await createTestUser()
        testAdmin = await createTestAdmin()
        userToken = await generateUserToken(testUser)
        adminToken = await generateAdminToken(testAdmin)

        testService = await AppDataSource.getRepository(Service).save({
            code: `RC-TEST-${Date.now()}`,
            name: "Rate Commission Test Service",
        })
        otherService = await AppDataSource.getRepository(Service).save({
            code: `RC-TEST-OTHER-${Date.now()}`,
            name: "Rate Commission Other Service",
        })
    })

    afterAll(async () => {
        await AppDataSource.getRepository(RateCommission).delete({ serviceCode: testService.code })
        await AppDataSource.getRepository(RateCommission).delete({ serviceCode: otherService.code })
        await AppDataSource.getRepository(Service).delete(testService.id)
        await AppDataSource.getRepository(Service).delete(otherService.id)
        if (testUser?.id) await cleanupTestUser(testUser.id)
        if (testAdmin?.id) await cleanupTestAdmin(testAdmin.id)
    })

    describe("POST /rate-commission", () => {
        let createdOtcId: number

        it("creates an OTC rate commission", async () => {
            const res = await authRequest("/rate-commission", adminToken, {
                method: "POST",
                body: {
                    serviceCode: testService.code,
                    category: "OTC",
                    value: 10,
                    type: "percentage",
                    startDate: "2025-01-01",
                    notes: "Initial rate",
                },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.category).toBe("OTC")
            expect(res.body.data.value).toBe(10)
            expect(res.body.data.type).toBe("percentage")
            expect(res.body.data.service.code).toBe(testService.code)
            expect(res.body.data.endDate).toBe(null)
            createdOtcId = res.body.data.id
        })

        it("records a 'created' history entry", async () => {
            const res = await authRequest(`/rate-commission/${createdOtcId}/history`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data.length).toBe(1)
            expect(res.body.data[0].action).toBe("created")
            expect(res.body.data[0].fromValue).toBe(null)
            expect(res.body.data[0].toValue).toBe(10)
            expect(res.body.data[0].notes).toBe("Initial rate")
            expect(res.body.data[0].service.code).toBe(testService.code)
        })

        it("creates a Bulanan rate commission for the same service", async () => {
            const res = await authRequest("/rate-commission", adminToken, {
                method: "POST",
                body: {
                    serviceCode: testService.code,
                    category: "Bulanan",
                    value: 15000,
                    type: "flat",
                    startDate: "2025-01-01",
                    endDate: "2025-12-31",
                    notes: "Promo akhir tahun",
                },
            })
            expect(res.status).toBe(200)
            expect(res.body.data.category).toBe("Bulanan")
            expect(res.body.data.notes).toBe("Promo akhir tahun")
        })

        it("rejects a second OTC rate for the same service (400)", async () => {
            const res = await authRequest("/rate-commission", adminToken, {
                method: "POST",
                body: {
                    serviceCode: testService.code,
                    category: "OTC",
                    value: 20,
                    type: "percentage",
                    startDate: "2025-01-01",
                },
            })
            expect(res.status).toBe(400)
        })

        it("rejects a percentage value over 100 (400)", async () => {
            const res = await authRequest("/rate-commission", adminToken, {
                method: "POST",
                body: {
                    serviceCode: otherService.code,
                    category: "OTC",
                    value: 150,
                    type: "percentage",
                    startDate: "2025-01-01",
                },
            })
            expect(res.status).toBe(400)
        })

        it("rejects endDate before startDate (400)", async () => {
            const res = await authRequest("/rate-commission", adminToken, {
                method: "POST",
                body: {
                    serviceCode: otherService.code,
                    category: "OTC",
                    value: 10,
                    type: "percentage",
                    startDate: "2025-06-01",
                    endDate: "2025-01-01",
                },
            })
            expect(res.status).toBe(400)
        })

        it("rejects invalid payload (422)", async () => {
            const res = await authRequest("/rate-commission", adminToken, {
                method: "POST",
                body: { serviceCode: otherService.code },
            })
            expect(res.status).toBe(422)
        })

        it("forbids a non-admin from creating (403)", async () => {
            const res = await authRequest("/rate-commission", userToken, {
                method: "POST",
                body: { serviceCode: otherService.code, category: "OTC", value: 10, type: "percentage", startDate: "2025-01-01" },
            })
            expect(res.status).toBe(403)
        })
    })

    describe("GET /rate-commission", () => {
        it("lists rate commissions filtered by category", async () => {
            const res = await authRequest("/rate-commission?category=OTC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data.every((r: any) => r.category === "OTC")).toBe(true)
            expect(res.body.data.some((r: any) => r.service.code === testService.code)).toBe(true)
        })

        it("searches by service name/code", async () => {
            const res = await authRequest(`/rate-commission?q=${testService.code}`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data.some((r: any) => r.service.code === testService.code)).toBe(true)
        })

        it("forbids a non-admin from listing (403)", async () => {
            const res = await authRequest("/rate-commission", userToken)
            expect(res.status).toBe(403)
        })

        it("filters by type", async () => {
            const res = await authRequest("/rate-commission?type=flat", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data.every((r: any) => r.type === "flat")).toBe(true)
            expect(res.body.data.some((r: any) => r.service.code === testService.code)).toBe(true)
        })

        it("filters by startDate range", async () => {
            const res = await authRequest("/rate-commission?startDateFrom=2025-01-01&startDateTo=2025-01-01", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data.some((r: any) => r.service.code === testService.code)).toBe(true)

            const outOfRange = await authRequest("/rate-commission?startDateFrom=2030-01-01&startDateTo=2030-12-31", adminToken)
            expect(outOfRange.status).toBe(200)
            expect(outOfRange.body.data.some((r: any) => r.service.code === testService.code)).toBe(false)
        })
    })

    describe("GET /rate-commission/taken-services", () => {
        it("returns service codes that already have an OTC rate", async () => {
            const res = await authRequest("/rate-commission/taken-services?category=OTC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data).toContain(testService.code)
            expect(res.body.data).not.toContain(otherService.code)
        })
    })

    describe("GET /rate-commission/histories", () => {
        it("lists history entries across all rate commissions, newest first", async () => {
            const res = await authRequest("/rate-commission/histories?limit=100", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.some((h: any) => h.service?.code === testService.code)).toBe(true)
            const timestamps = res.body.data.map((h: any) => new Date(h.createdAt).getTime())
            expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a))
        })

        it("searches by service name/code", async () => {
            const res = await authRequest(`/rate-commission/histories?q=${testService.code}`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data.every((h: any) => h.service?.code === testService.code)).toBe(true)
        })

        it("searches by changed-by name", async () => {
            const res = await authRequest(`/rate-commission/histories?q=${encodeURIComponent(testAdmin.name)}&limit=100`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data.length).toBeGreaterThan(0)
            expect(res.body.data.every((h: any) => h.changedBy?.name === testAdmin.name)).toBe(true)
        })

        it("supports pagination", async () => {
            const res = await authRequest("/rate-commission/histories?page=1&limit=1", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data.length).toBe(1)
            expect(res.body.meta.perPage).toBe(1)
        })

        it("forbids a non-admin from listing (403)", async () => {
            const res = await authRequest("/rate-commission/histories", userToken)
            expect(res.status).toBe(403)
        })
    })

    describe("PUT /rate-commission/:id", () => {
        let rateId: number

        beforeAll(async () => {
            const created = await AppDataSource.getRepository(RateCommission).save({
                serviceCode: otherService.code,
                category: "OTC" as any,
                value: 5,
                type: "flat" as any,
                startDate: new Date("2025-01-01"),
                createdById: testAdmin.id,
            })
            rateId = created.id
        })

        it("updates the value and notes", async () => {
            const res = await authRequest(`/rate-commission/${rateId}`, adminToken, {
                method: "PUT",
                body: { value: 25000, notes: "Updated note" },
            })
            expect(res.status).toBe(200)
            expect(res.body.data.value).toBe(25000)
            expect(res.body.data.notes).toBe("Updated note")
        })

        it("records history for the change (value 5 -> 25000)", async () => {
            const res = await authRequest(`/rate-commission/${rateId}/history`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.length).toBe(1)
            expect(res.body.data[0].action).toBe("updated")
            expect(res.body.data[0].fromValue).toBe(5)
            expect(res.body.data[0].toValue).toBe(25000)
            expect(res.body.data[0].fromType).toBe("flat")
            expect(res.body.data[0].toType).toBe("flat")
            expect(res.body.data[0].notes).toBe("Updated note")
            expect(res.body.data[0].service.code).toBe(otherService.code)
            expect(res.body.data[0].category).toBe("OTC")
            expect(res.body.data[0].changedBy).toEqual({ id: testAdmin.id, name: testAdmin.name })
            expect(res.body.data[0].createdAt).toBeTruthy()
        })

        it("does not record history when nothing actually changes", async () => {
            const before = await authRequest(`/rate-commission/${rateId}/history`, adminToken)
            const countBefore = before.body.data.length

            const res = await authRequest(`/rate-commission/${rateId}`, adminToken, {
                method: "PUT",
                body: { value: 25000, notes: "Updated note" },
            })
            expect(res.status).toBe(200)

            const after = await authRequest(`/rate-commission/${rateId}/history`, adminToken)
            expect(after.body.data.length).toBe(countBefore)
        })

        it("forbids a non-admin from viewing history (403)", async () => {
            const res = await authRequest(`/rate-commission/${rateId}/history`, userToken)
            expect(res.status).toBe(403)
        })

        it("rejects changing to a service+category that's already taken (400)", async () => {
            const res = await authRequest(`/rate-commission/${rateId}`, adminToken, {
                method: "PUT",
                body: { serviceCode: testService.code, category: "OTC" },
            })
            expect(res.status).toBe(400)
        })

        it("returns 404 for a non-existent id", async () => {
            const res = await authRequest("/rate-commission/999999", adminToken, {
                method: "PUT",
                body: { value: 1 },
            })
            expect(res.status).toBe(404)
        })
    })

    describe("DELETE /rate-commission/:id", () => {
        it("deletes a rate commission", async () => {
            const created = await AppDataSource.getRepository(RateCommission).save({
                serviceCode: otherService.code,
                category: "Bulanan" as any,
                value: 5,
                type: "flat" as any,
                startDate: new Date("2025-01-01"),
                createdById: testAdmin.id,
            })

            const res = await authRequest(`/rate-commission/${created.id}`, adminToken, { method: "DELETE" })
            expect(res.status).toBe(200)

            const check = await authRequest(`/rate-commission/${created.id}`, adminToken)
            expect(check.status).toBe(404)
        })

        it("forbids a non-admin from deleting (403)", async () => {
            const res = await authRequest("/rate-commission/999999", userToken, { method: "DELETE" })
            expect(res.status).toBe(403)
        })
    })
})
