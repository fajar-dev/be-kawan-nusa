import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Profile Module", () => {
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

    describe("GET /profile", () => {
        it("should return user profile", async () => {
            const res = await authRequest("/profile", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.email).toBe(testUser.email)
            expect(res.body.data.firstName).toBe(testUser.firstName)
        })

        it("should fail without auth", async () => {
            const res = await request("/profile")
            expect(res.status).toBe(401)
        })

        it("should fail for admin role", async () => {
            const res = await authRequest("/profile", adminToken)
            expect(res.status).toBe(403)
        })
    })

    describe("PUT /profile/account", () => {
        it("should update account with valid data", async () => {
            const res = await authRequest("/profile/account", userToken, {
                method: "PUT",
                body: { firstName: "Updated", lastName: "Name" },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail with firstName too short", async () => {
            const res = await authRequest("/profile/account", userToken, {
                method: "PUT",
                body: { firstName: "A" },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with missing firstName", async () => {
            const res = await authRequest("/profile/account", userToken, {
                method: "PUT",
                body: {},
            })
            expect(res.status).toBe(422)
        })

        it("should fail without auth", async () => {
            const res = await request("/profile/account", {
                method: "PUT",
                body: { firstName: "No Auth" },
            })
            expect(res.status).toBe(401)
        })
    })

    describe("PUT /profile/bank", () => {
        it("should update bank info with valid data", async () => {
            const res = await authRequest("/profile/bank", userToken, {
                method: "PUT",
                body: { bankName: "BCA", accountNumber: "1234567890", accountHolderName: "Test User" },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail with missing required bank fields", async () => {
            const res = await authRequest("/profile/bank", userToken, {
                method: "PUT",
                body: { bankName: "BCA" },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with empty body", async () => {
            const res = await authRequest("/profile/bank", userToken, {
                method: "PUT",
                body: {},
            })
            expect(res.status).toBe(422)
        })
    })

    describe("PUT /profile/preference", () => {
        it("should update preferences", async () => {
            const res = await authRequest("/profile/preference", userToken, {
                method: "PUT",
                body: { isSubscribe: true, isAutoWithdraw: false },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe("PUT /profile/password", () => {
        it("should fail with wrong current password", async () => {
            const res = await authRequest("/profile/password", userToken, {
                method: "PUT",
                body: { currentPassword: "wrongpassword", newPassword: "newpass123", newPasswordConfirmation: "newpass123" },
            })
            expect(res.status).toBe(400)
        })

        it("should fail when new passwords do not match", async () => {
            const res = await authRequest("/profile/password", userToken, {
                method: "PUT",
                body: { currentPassword: "password123", newPassword: "newpass123", newPasswordConfirmation: "different" },
            })
            expect(res.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail with missing fields", async () => {
            const res = await authRequest("/profile/password", userToken, {
                method: "PUT",
                body: {},
            })
            expect(res.status).toBe(422)
        })
    })
})
