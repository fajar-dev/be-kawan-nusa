import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Catalog Category Module", () => {
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

    describe("GET /catalog/category", () => {
        it("should return category list", async () => {
            const res = await authRequest("/catalog/category", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe("POST /catalog/category (admin)", () => {
        it("should create category as admin", async () => {
            const res = await authRequest("/catalog/category", adminToken, {
                method: "POST",
                body: { name: `Test Category ${Date.now()}` },
            })
            // May be 201 or 200 depending on controller
            expect([200, 201]).toContain(res.status)
        })

        it("should fail when user tries to create", async () => {
            const res = await authRequest("/catalog/category", userToken, {
                method: "POST",
                body: { name: "User Category" },
            })
            expect(res.status).toBe(403)
        })
    })
})
