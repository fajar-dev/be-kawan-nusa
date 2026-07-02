import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { UserStatus } from "../../src/modules/user/user.enum"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { AppDataSource } from "../../src/config/database"

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

        it("should support comma-separated status filter", async () => {
            const res = await authRequest("/user?status=active,inactive", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support single status filter", async () => {
            const res = await authRequest("/user?status=active", adminToken)
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

        it("should include new profile fields in response", async () => {
            const res = await authRequest(`/user/${testUser.id}`, adminToken)
            expect(res.status).toBe(200)
            const data = res.body.data
            expect("birthDate" in data).toBe(true)
            expect("birthPlace" in data).toBe(true)
            expect("address" in data).toBe(true)
            expect("companyAddress" in data).toBe(true)
            expect("identityPath" in data).toBe(true)
            expect("accountPath" in data.bankDetails).toBe(true)
        })

        it("should include statusNote and statusUpdatedAt", async () => {
            const res = await authRequest(`/user/${testUser.id}`, adminToken)
            expect(res.status).toBe(200)
            expect("statusNote" in res.body.data).toBe(true)
            expect("statusUpdatedAt" in res.body.data).toBe(true)
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

    describe("GET /user/:id/point", () => {
        it("should return user points as admin", async () => {
            const res = await authRequest(`/user/${testUser.id}/point`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest(`/user/${testUser.id}/point?page=1&limit=5`, adminToken)
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

    describe("PATCH /user/:id/status", () => {
        let pendingUser: User
        let pendingUserIds: number[] = []

        afterAll(async () => {
            for (const id of pendingUserIds) {
                await cleanupTestUser(id)
            }
        })

        it("should approve a pending user", async () => {
            pendingUser = await createTestUser({ status: UserStatus.PENDING })
            pendingUserIds.push(pendingUser.id)

            const res = await authRequest(`/user/${pendingUser.id}/status`, adminToken, {
                method: "PATCH",
                body: { status: "active", note: "Data lengkap dan valid." },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.status).toBe("active")
            expect(res.body.data.statusNote).toBe("Data lengkap dan valid.")
            expect(res.body.data.statusUpdatedAt).toBeDefined()
        })

        it("should reject a pending user", async () => {
            const user = await createTestUser({ status: UserStatus.PENDING })
            pendingUserIds.push(user.id)

            const res = await authRequest(`/user/${user.id}/status`, adminToken, {
                method: "PATCH",
                body: { status: "reject", note: "Data tidak valid." },
            })
            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("reject")
        })

        it("should request revision for a pending user", async () => {
            const user = await createTestUser({ status: UserStatus.PENDING })
            pendingUserIds.push(user.id)

            const res = await authRequest(`/user/${user.id}/status`, adminToken, {
                method: "PATCH",
                body: { status: "revision", note: "Mohon perbaiki foto KTP." },
            })
            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("revision")
        })

        it("should approve a user with revision status", async () => {
            const user = await createTestUser({ status: UserStatus.REVISION })
            pendingUserIds.push(user.id)

            const res = await authRequest(`/user/${user.id}/status`, adminToken, {
                method: "PATCH",
                body: { status: "active", note: "Ok, sudah diperbaiki." },
            })
            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("active")
        })

        it("should fail to change status of an active user (400)", async () => {
            const res = await authRequest(`/user/${testUser.id}/status`, adminToken, {
                method: "PATCH",
                body: { status: "reject", note: "Test reject active." },
            })
            expect(res.status).toBe(400)
        })

        it("should fail for non-existent user (404)", async () => {
            const res = await authRequest("/user/999999/status", adminToken, {
                method: "PATCH",
                body: { status: "active", note: "Test." },
            })
            expect(res.status).toBe(404)
        })

        it("should fail with missing note (422)", async () => {
            const user = await createTestUser({ status: UserStatus.PENDING })
            pendingUserIds.push(user.id)

            const res = await authRequest(`/user/${user.id}/status`, adminToken, {
                method: "PATCH",
                body: { status: "active" },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with invalid status value (422)", async () => {
            const user = await createTestUser({ status: UserStatus.PENDING })
            pendingUserIds.push(user.id)

            const res = await authRequest(`/user/${user.id}/status`, adminToken, {
                method: "PATCH",
                body: { status: "invalid", note: "Test." },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with note exceeding 110 chars (422)", async () => {
            const user = await createTestUser({ status: UserStatus.PENDING })
            pendingUserIds.push(user.id)

            const res = await authRequest(`/user/${user.id}/status`, adminToken, {
                method: "PATCH",
                body: { status: "active", note: "a".repeat(111) },
            })
            expect(res.status).toBe(422)
        })

        it("should fail for user role (403)", async () => {
            const user = await createTestUser({ status: UserStatus.PENDING })
            pendingUserIds.push(user.id)

            const res = await authRequest(`/user/${user.id}/status`, userToken, {
                method: "PATCH",
                body: { status: "active", note: "Test." },
            })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request(`/user/${testUser.id}/status`, {
                method: "PATCH",
                body: { status: "active", note: "Test." },
            })
            expect(res.status).toBe(401)
        })
    })
})
