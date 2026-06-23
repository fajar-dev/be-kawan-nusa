import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Point Module", () => {
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

    describe("GET /point", () => {
        it("should return point balance for user", async () => {
            const res = await authRequest("/point", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data).toBeDefined()
        })

        it("should fail without auth", async () => {
            const res = await request("/point")
            expect(res.status).toBe(401)
        })

        it("should fail for admin role", async () => {
            const res = await authRequest("/point", adminToken)
            expect(res.status).toBe(403)
        })

        it("should fail with invalid token", async () => {
            const res = await authRequest("/point", "invalid.jwt.token")
            expect(res.status).toBe(401)
        })
    })
})
