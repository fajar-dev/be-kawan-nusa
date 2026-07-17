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

    describe("GET /service/promotion/:id", () => {
        it("should return 404 for a non-existent promotion", async () => {
            const res = await authRequest("/service/promotion/999999", userToken)
            expect(res.status).toBe(404)
        })
    })

    describe("PUT / DELETE /service/promotion/:id (admin only)", () => {
        it("should forbid a non-admin from updating", async () => {
            const res = await authRequest("/service/promotion/1", userToken, { method: "PUT", body: { title: "x" } })
            expect(res.status).toBe(403)
        })
        it("should forbid a non-admin from deleting", async () => {
            const res = await authRequest("/service/promotion/1", userToken, { method: "DELETE" })
            expect(res.status).toBe(403)
        })
        it("should return 404 when admin deletes a non-existent promotion", async () => {
            const res = await authRequest("/service/promotion/999999", adminToken, { method: "DELETE" })
            expect(res.status).toBe(404)
        })
    })
})
