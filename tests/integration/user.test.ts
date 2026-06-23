import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("User Module (Admin)", () => {
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

    describe("GET /user", () => {
        it("should return user list as admin", async () => {
            const res = await authRequest("/user", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(Array.isArray(res.body.data)).toBe(true)
        })

        it("should support page and limit params", async () => {
            const res = await authRequest("/user?page=1&limit=5", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.meta).toBeDefined()
        })

        it("should support search param", async () => {
            const res = await authRequest("/user?search=test", adminToken)
            expect(res.status).toBe(200)
        })

        it("should fail for user role", async () => {
            const res = await authRequest("/user", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth", async () => {
            const res = await request("/user")
            expect(res.status).toBe(401)
        })
    })

    describe("GET /user/:id", () => {
        it("should return user detail as admin", async () => {
            const res = await authRequest(`/user/${testUser.id}`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.id).toBe(testUser.id)
        })

        it("should return 404 for non-existent user", async () => {
            const res = await authRequest("/user/999999", adminToken)
            expect(res.status).toBe(404)
        })

        it("should fail for user role", async () => {
            const res = await authRequest(`/user/${testUser.id}`, userToken)
            expect(res.status).toBe(403)
        })
    })

    describe("GET /user/:id/services", () => {
        it("should return user services as admin", async () => {
            const res = await authRequest(`/user/${testUser.id}/services`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest(`/user/${testUser.id}/services?page=1&limit=5`, adminToken)
            expect(res.status).toBe(200)
        })

        it("should fail for user role", async () => {
            const res = await authRequest(`/user/${testUser.id}/services`, userToken)
            expect(res.status).toBe(403)
        })
    })

    describe("GET /user/:id/reward", () => {
        it("should return user rewards as admin", async () => {
            const res = await authRequest(`/user/${testUser.id}/reward`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest(`/user/${testUser.id}/reward?page=1&limit=5`, adminToken)
            expect(res.status).toBe(200)
        })
    })

    describe("GET /user/:id/redeem", () => {
        it("should return user redemptions as admin", async () => {
            const res = await authRequest(`/user/${testUser.id}/redeem`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe("GET /user/:id/statistic", () => {
        it("should return user statistics as admin", async () => {
            const res = await authRequest(`/user/${testUser.id}/statistic`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail for user role", async () => {
            const res = await authRequest(`/user/${testUser.id}/statistic`, userToken)
            expect(res.status).toBe(403)
        })
    })
})
