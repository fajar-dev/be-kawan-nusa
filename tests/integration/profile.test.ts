import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest, formRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { UserStatus } from "../../src/modules/user/user.enum"

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
        const getValidAccount = () => ({
            firstName: "Updated",
            lastName: "Name",
            email: testUser.email,
            phone: testUser.phone,
            identityNumber: 1234567890123456,
            taxNumber: "12.345.678.9-012.000",
            birthDate: "1990-05-15",
            birthPlace: "Surabaya",
            address: "Jl. Raya Darmo No. 10, Surabaya",
        })

        it("should update account with valid data", async () => {
            const res = await authRequest("/profile/account", userToken, {
                method: "PUT",
                body: getValidAccount(),
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should update account with company fields", async () => {
            const res = await authRequest("/profile/account", userToken, {
                method: "PUT",
                body: {
                    ...getValidAccount(),
                    company: "PT Nusanet",
                    jobPosition: "Engineer",
                    companyAddress: "Jl. Ngagel Jaya No. 88, Surabaya",
                },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should accept null for company fields", async () => {
            const res = await authRequest("/profile/account", userToken, {
                method: "PUT",
                body: {
                    ...getValidAccount(),
                    company: null,
                    jobPosition: null,
                    companyAddress: null,
                },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
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
                body: getValidAccount(),
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

        it("should fail without auth", async () => {
            const res = await request("/profile/preference", {
                method: "PUT",
                body: { isSubscribe: true },
            })
            expect(res.status).toBe(401)
        })
    })

    describe("PUT /profile/password", () => {
        it("should change password with correct old password", async () => {
            const res = await authRequest("/profile/password", userToken, {
                method: "PUT",
                body: { oldPassword: "password123", newPassword: "NewPass1!" },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail with wrong old password", async () => {
            const res = await authRequest("/profile/password", userToken, {
                method: "PUT",
                body: { oldPassword: "wrongpassword", newPassword: "NewPass1!" },
            })
            expect(res.status).toBe(400)
        })

        it("should fail with missing newPassword", async () => {
            const res = await authRequest("/profile/password", userToken, {
                method: "PUT",
                body: {},
            })
            expect(res.status).toBe(422)
        })

        it("should fail without auth", async () => {
            const res = await request("/profile/password", {
                method: "PUT",
                body: { oldPassword: "password123", newPassword: "NewPass1!" },
            })
            expect(res.status).toBe(401)
        })
    })

    describe("POST /profile/complete-boarding", () => {
        it("should mark boarding as complete", async () => {
            const res = await authRequest("/profile/complete-boarding", userToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.isBoarding).toBe(true)
        })

        it("should set status to pending from revision", async () => {
            const revisionUser = await createTestUser({ status: UserStatus.REVISION, isBoarding: false, statusNote: "Foto KTP kurang jelas" })
            const revisionToken = await generateUserToken(revisionUser)
            try {
                const res = await authRequest("/profile/complete-boarding", revisionToken, {
                    method: "POST",
                    body: {},
                })
                expect(res.status).toBe(200)
                expect(res.body.data.isBoarding).toBe(true)
                expect(res.body.data.status).toBe("pending")
            } finally {
                await cleanupTestUser(revisionUser.id)
            }
        })

        it("should fail without auth", async () => {
            const res = await request("/profile/complete-boarding", {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(401)
        })

        it("should fail for admin role", async () => {
            const res = await authRequest("/profile/complete-boarding", adminToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(403)
        })
    })

    describe("GET /auth/me", () => {
        it("should return isVerified and statusNote in user response", async () => {
            const res = await authRequest("/auth/me", userToken)
            expect(res.status).toBe(200)
            expect(res.body.data).toHaveProperty("isVerified")
            expect(res.body.data).toHaveProperty("statusNote")
            expect(res.body.data).toHaveProperty("isBoarding")
        })
    })

    describe("POST /profile/documents", () => {
        it("should upload identity document", async () => {
            const formData = new FormData()
            const file = new File(["fake-image-data"], "ktp.jpg", { type: "image/jpeg" })
            formData.append("identity", file)

            const res = await formRequest("/profile/documents", formData, {
                headers: { Authorization: `Bearer ${userToken}` },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should upload account document", async () => {
            const formData = new FormData()
            const file = new File(["fake-image-data"], "rekening.jpg", { type: "image/jpeg" })
            formData.append("account", file)

            const res = await formRequest("/profile/documents", formData, {
                headers: { Authorization: `Bearer ${userToken}` },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should upload both documents", async () => {
            const formData = new FormData()
            formData.append("identity", new File(["fake"], "ktp.jpg", { type: "image/jpeg" }))
            formData.append("account", new File(["fake"], "rek.jpg", { type: "image/jpeg" }))

            const res = await formRequest("/profile/documents", formData, {
                headers: { Authorization: `Bearer ${userToken}` },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail without auth", async () => {
            const formData = new FormData()
            formData.append("identity", new File(["fake"], "ktp.jpg", { type: "image/jpeg" }))

            const res = await formRequest("/profile/documents", formData)
            expect(res.status).toBe(401)
        })

        it("should fail for admin role", async () => {
            const formData = new FormData()
            formData.append("identity", new File(["fake"], "ktp.jpg", { type: "image/jpeg" }))

            const res = await formRequest("/profile/documents", formData, {
                headers: { Authorization: `Bearer ${adminToken}` },
            })
            expect(res.status).toBe(403)
        })
    })
})
