import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Customer Module", () => {
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

    describe("GET /customer", () => {
        it("should return customer list", async () => {
            const res = await authRequest("/customer", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(Array.isArray(res.body.data)).toBe(true)
        })

        it("should support page and limit params", async () => {
            const res = await authRequest("/customer?page=1&limit=5", userToken)
            expect(res.status).toBe(200)
            expect(res.body.meta).toBeDefined()
        })

        it("should support search param", async () => {
            const res = await authRequest("/customer?search=test", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support type filter param", async () => {
            const res = await authRequest("/customer?type=personal", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail without auth", async () => {
            const res = await request("/customer")
            expect(res.status).toBe(401)
        })

        it("should fail for admin role", async () => {
            const res = await authRequest("/customer", adminToken)
            expect(res.status).toBe(403)
        })
    })

    describe("GET /customer/:id", () => {
        it("should return 404 for non-existent customer", async () => {
            const res = await authRequest("/customer/999999", userToken)
            expect(res.status).toBe(404)
        })

        it("should fail without auth", async () => {
            const res = await request("/customer/1")
            expect(res.status).toBe(401)
        })
    })

    describe("GET /customer/:id/service", () => {
        it("should return 404 for non-existent customer", async () => {
            const res = await authRequest("/customer/999999/service", userToken)
            expect(res.status).toBe(404)
        })
    })

    describe("GET /customer/:id/reward", () => {
        it("should return empty rewards for non-existent customer", async () => {
            const res = await authRequest("/customer/999999/reward", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })
})
