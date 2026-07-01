import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request, formRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Catalog Module", () => {
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

    // User routes
    describe("GET /catalog", () => {
        it("should return catalog list", async () => {
            const res = await authRequest("/catalog", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest("/catalog?page=1&limit=5", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support search filter", async () => {
            const res = await authRequest("/catalog?q=test", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support category filter", async () => {
            const res = await authRequest("/catalog?categoryId=1", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support type filter", async () => {
            const res = await authRequest("/catalog?type=voucher", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support sorting", async () => {
            const res = await authRequest("/catalog?sort=stock&order=ASC", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail without auth", async () => {
            const res = await request("/catalog")
            expect(res.status).toBe(401)
        })
    })

    describe("GET /catalog/:id", () => {
        it("should return 404 for non-existent", async () => {
            const res = await authRequest("/catalog/999999", userToken)
            expect(res.status).toBe(404)
        })

        it("should fail without auth", async () => {
            const res = await request("/catalog/1")
            expect(res.status).toBe(401)
        })
    })

    // Admin routes
    describe("GET /catalog/:id/stock-history (admin)", () => {
        it("should return 404 for non-existent catalog", async () => {
            const res = await authRequest("/catalog/999999/stock-history", adminToken)
            expect(res.status).toBe(404)
        })

        it("should fail for user role", async () => {
            const res = await authRequest("/catalog/1/stock-history", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth", async () => {
            const res = await request("/catalog/1/stock-history")
            expect(res.status).toBe(401)
        })
    })

    describe("POST /catalog (admin)", () => {
        it("should fail for user role", async () => {
            const formData = new FormData()
            formData.append("name", "Test Catalog")
            formData.append("categoryId", "1")
            formData.append("type", "voucher")
            formData.append("point", "100")
            formData.append("stock", "10")

            const res = await formRequest("/catalog", formData, {
                headers: { Authorization: `Bearer ${userToken}` },
            })
            expect(res.status).toBe(403)
        })

        it("should fail without auth", async () => {
            const formData = new FormData()
            formData.append("name", "Test Catalog")

            const res = await formRequest("/catalog", formData)
            expect(res.status).toBe(401)
        })
    })

    describe("PUT /catalog/:id (admin)", () => {
        it("should return error for non-existent id", async () => {
            const formData = new FormData()
            formData.append("name", "Updated Catalog")

            const res = await formRequest("/catalog/999999", formData, {
                method: "PUT",
                headers: { Authorization: `Bearer ${adminToken}` },
            })
            expect(res.status).toBe(404)
        })

        it("should fail for user role", async () => {
            const formData = new FormData()
            formData.append("name", "Updated Catalog")

            const res = await formRequest("/catalog/1", formData, {
                method: "PUT",
                headers: { Authorization: `Bearer ${userToken}` },
            })
            expect(res.status).toBe(403)
        })
    })

    describe("DELETE /catalog/:id (admin)", () => {
        it("should return error for non-existent id", async () => {
            const res = await authRequest("/catalog/999999", adminToken, { method: "DELETE" })
            expect(res.status).toBe(404)
        })

        it("should fail for user role", async () => {
            const res = await authRequest("/catalog/1", userToken, { method: "DELETE" })
            expect(res.status).toBe(403)
        })
    })
})
