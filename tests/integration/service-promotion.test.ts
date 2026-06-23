import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Service Promotion Module", () => {
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

    describe("GET /service/promotion", () => {
        it("should return promotion list", async () => {
            const res = await authRequest("/service/promotion", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe("POST /service/promotion (admin)", () => {
        it("should fail when user tries to create", async () => {
            const res = await authRequest("/service/promotion", userToken, {
                method: "POST",
                body: { title: "Test Promo" },
            })
            expect(res.status).toBe(403)
        })
    })
})
