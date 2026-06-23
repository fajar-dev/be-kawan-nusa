import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Statistic Module", () => {
    let testUser: User
    let testAdmin: Employee
    let userToken: string
    let adminToken: string

    beforeAll(async () => {
        testUser = await createTestUser()
        testAdmin = await createTestAdmin()
        userToken = await generateUserToken(testUser)
        adminToken = await generateAdminToken(testAdmin)
    })

    afterAll(async () => {
        if (testUser?.id) await cleanupTestUser(testUser.id)
        if (testAdmin?.id) await cleanupTestAdmin(testAdmin.id)
    })

    describe("GET /statistic/count", () => {
        it("should return statistics count", async () => {
            const res = await authRequest("/statistic/count", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail for admin role", async () => {
            const res = await authRequest("/statistic/count", adminToken)
            expect(res.status).toBe(403)
        })
    })

    describe("GET /statistic/point", () => {
        it("should return point per month", async () => {
            const res = await authRequest("/statistic/point", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support year param", async () => {
            const res = await authRequest("/statistic/point?year=2024", userToken)
            expect(res.status).toBe(200)
        })
    })

    describe("GET /statistic/customer", () => {
        it("should return customer stats", async () => {
            const res = await authRequest("/statistic/customer", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe("GET /statistic/redemption-reward", () => {
        it("should return redemption reward stats", async () => {
            const res = await authRequest("/statistic/redemption-reward", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe("GET /statistic/admin/summary", () => {
        it("should return admin summary", async () => {
            const res = await authRequest("/statistic/admin/summary", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail for user role", async () => {
            const res = await authRequest("/statistic/admin/summary", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth", async () => {
            const res = await request("/statistic/admin/summary")
            expect(res.status).toBe(401)
        })
    })
})
