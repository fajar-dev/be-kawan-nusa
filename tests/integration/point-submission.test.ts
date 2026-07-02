import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Point Submission Module", () => {
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

    // ── List ──────────────────────────────────────────────────────────────

    describe("GET /point-submission", () => {
        it("should return submission list for admin", async () => {
            const res = await authRequest("/point-submission", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest("/point-submission?page=1&limit=5", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support search filter", async () => {
            const res = await authRequest("/point-submission?q=test", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support status filter", async () => {
            const res = await authRequest("/point-submission?status=pending", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support type filter", async () => {
            const res = await authRequest("/point-submission?type=OTC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support date range filter", async () => {
            const res = await authRequest("/point-submission?startDate=2024-01-01&endDate=2030-12-31", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support sorting", async () => {
            const res = await authRequest("/point-submission?sort=createdAt&order=ASC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission")
            expect(res.status).toBe(401)
        })
    })

    // ── Detail ─────────────────────────────────────────────────────────────

    describe("GET /point-submission/:id", () => {
        it("should return 404 for non-existent", async () => {
            const res = await authRequest("/point-submission/999999", adminToken)
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission/1", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission/1")
            expect(res.status).toBe(401)
        })
    })

    // ── Check Account ──────────────────────────────────────────────────────

    describe("GET /point-submission/check-account", () => {
        it("should return result for admin", async () => {
            const res = await authRequest("/point-submission/check-account?custServId=999999", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission/check-account?custServId=1", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission/check-account?custServId=1")
            expect(res.status).toBe(401)
        })
    })

    // ── Create ─────────────────────────────────────────────────────────────

    describe("POST /point-submission", () => {
        it("should fail with validation error (422)", async () => {
            const res = await authRequest("/point-submission", adminToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(422)
        })

        it("should fail with incomplete data (422)", async () => {
            const res = await authRequest("/point-submission", adminToken, {
                method: "POST",
                body: {
                    userId: 1,
                    // missing required fields
                },
            })
            expect(res.status).toBe(422)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission", userToken, {
                method: "POST",
                body: {
                    userId: 1,
                    type: "OTC",
                    price: 10000,
                    nisData: {
                        custServId: 1,
                        custId: "CUST001",
                        accountName: "Test Account",
                        serviceCode: "SVC001",
                        serviceName: "Internet",
                        accountManager: null,
                        salesEmployeeId: null,
                    },
                },
            })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission", {
                method: "POST",
                body: {
                    userId: 1,
                    type: "OTC",
                    price: 10000,
                },
            })
            expect(res.status).toBe(401)
        })
    })

    // ── Update ─────────────────────────────────────────────────────────────

    describe("PUT /point-submission/:id", () => {
        it("should return 404 for non-existent id", async () => {
            const res = await authRequest("/point-submission/999999", adminToken, {
                method: "PUT",
                body: { price: 20000 },
            })
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission/1", userToken, {
                method: "PUT",
                body: { price: 20000 },
            })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission/1", {
                method: "PUT",
                body: { price: 20000 },
            })
            expect(res.status).toBe(401)
        })
    })

    // ── Delete ─────────────────────────────────────────────────────────────

    describe("DELETE /point-submission/:id", () => {
        it("should return 404 for non-existent id", async () => {
            const res = await authRequest("/point-submission/999999", adminToken, { method: "DELETE" })
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission/1", userToken, { method: "DELETE" })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission/1", { method: "DELETE" })
            expect(res.status).toBe(401)
        })
    })

    // ── Approve ────────────────────────────────────────────────────────────

    describe("POST /point-submission/approve", () => {
        it("should fail with validation error (422) - empty ids", async () => {
            const res = await authRequest("/point-submission/approve", adminToken, {
                method: "POST",
                body: { ids: [] },
            })
            expect(res.status).toBe(422)
        })

        it("should return 404 for non-existent ids", async () => {
            const res = await authRequest("/point-submission/approve", adminToken, {
                method: "POST",
                body: { ids: [999999], notes: "Test approval" },
            })
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission/approve", userToken, {
                method: "POST",
                body: { ids: [1] },
            })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission/approve", {
                method: "POST",
                body: { ids: [1] },
            })
            expect(res.status).toBe(401)
        })
    })

    // ── NIS Account Search ─────────────────────────────────────────────────

    describe("GET /nis/account", () => {
        it("should fail for user role (403)", async () => {
            const res = await authRequest("/nis/account?q=test", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/nis/account?q=test")
            expect(res.status).toBe(401)
        })
    })
})
