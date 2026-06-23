import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Redemption Module", () => {
    let testUser: User
    let testAdmin: Employee
    let userToken: string
    let adminToken: string

    beforeAll(async () => {
        testUser = await createTestUser({
            bankName: "BCA",
            accountNumber: "1234567890",
            accountHolderName: "Test User",
        })
        testAdmin = await createTestAdmin()
        userToken = await generateUserToken(testUser)
        adminToken = await generateAdminToken(testAdmin)
    })

    afterAll(async () => {
        if (testUser?.id) await cleanupTestUser(testUser.id)
        if (testAdmin?.id) await cleanupTestAdmin(testAdmin.id)
    })

    // User routes
    describe("GET /redemption", () => {
        it("should return redemption list", async () => {
            const res = await authRequest("/redemption", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest("/redemption?page=1&limit=5", userToken)
            expect(res.status).toBe(200)
        })

        it("should support type filter", async () => {
            const res = await authRequest("/redemption?type=cash", userToken)
            expect(res.status).toBe(200)
        })

        it("should support status filter", async () => {
            const res = await authRequest("/redemption?status=pending", userToken)
            expect(res.status).toBe(200)
        })

        it("should fail without auth", async () => {
            const res = await request("/redemption")
            expect(res.status).toBe(401)
        })
    })

    describe("GET /redemption/:id", () => {
        it("should return 404 for non-existent", async () => {
            const res = await authRequest("/redemption/999999", userToken)
            expect(res.status).toBe(404)
        })
    })

    describe("POST /redemption/cash", () => {
        it("should fail with insufficient points", async () => {
            const res = await authRequest("/redemption/cash", userToken, {
                method: "POST",
                body: { pointsUsed: 999999 },
            })
            expect(res.status).toBe(400)
        })

        it("should fail with zero points", async () => {
            const res = await authRequest("/redemption/cash", userToken, {
                method: "POST",
                body: { pointsUsed: 0 },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with negative points", async () => {
            const res = await authRequest("/redemption/cash", userToken, {
                method: "POST",
                body: { pointsUsed: -100 },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with missing pointsUsed", async () => {
            const res = await authRequest("/redemption/cash", userToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(422)
        })
    })

    describe("POST /redemption/voucher", () => {
        it("should fail with missing catalogId", async () => {
            const res = await authRequest("/redemption/voucher", userToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(422)
        })
    })

    describe("POST /redemption/product", () => {
        it("should fail with missing required fields", async () => {
            const res = await authRequest("/redemption/product", userToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(422)
        })

        it("should fail with missing address", async () => {
            const res = await authRequest("/redemption/product", userToken, {
                method: "POST",
                body: { catalogId: 1, quantity: 1 },
            })
            expect(res.status).toBe(422)
        })
    })

    // Admin routes
    describe("GET /redemption/cash/list (admin)", () => {
        it("should return cash list as admin", async () => {
            const res = await authRequest("/redemption/cash/list", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest("/redemption/cash/list?page=1&limit=5", adminToken)
            expect(res.status).toBe(200)
        })

        it("should support status filter", async () => {
            const res = await authRequest("/redemption/cash/list?status=pending", adminToken)
            expect(res.status).toBe(200)
        })

        it("should fail for user role", async () => {
            const res = await authRequest("/redemption/cash/list", userToken)
            expect(res.status).toBe(403)
        })
    })

    describe("GET /redemption/product/list (admin)", () => {
        it("should return product list as admin", async () => {
            const res = await authRequest("/redemption/product/list", adminToken)
            expect(res.status).toBe(200)
        })

        it("should fail for user role", async () => {
            const res = await authRequest("/redemption/product/list", userToken)
            expect(res.status).toBe(403)
        })
    })

    describe("GET /redemption/voucher/list (admin)", () => {
        it("should return voucher list as admin", async () => {
            const res = await authRequest("/redemption/voucher/list", adminToken)
            expect(res.status).toBe(200)
        })

        it("should fail for user role", async () => {
            const res = await authRequest("/redemption/voucher/list", userToken)
            expect(res.status).toBe(403)
        })
    })

    describe("PUT /redemption/cash/list/:id (admin)", () => {
        it("should return error for non-existent id", async () => {
            const res = await authRequest("/redemption/cash/list/999999", adminToken, { method: "PUT" })
            expect(res.status).toBeGreaterThanOrEqual(400)
        })
    })
})
