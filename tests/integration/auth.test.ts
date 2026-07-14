import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest, formRequest } from "../helpers/test-client"
import { createTestUser, generateUserToken, cleanupTestUser } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { UserStatus } from "../../src/modules/user/user.enum"
import { AppDataSource } from "../../src/config/database"
import { PasswordResetToken } from "../../src/modules/auth/entities/password-reset-token.entity"

// Helper to create a dummy image file for testing
function createTestFile(name: string = "test.jpg", type: string = "image/jpeg"): File {
    const buffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]) // minimal JPEG header
    return new File([buffer], name, { type })
}

// Helper to build a valid register payload
function buildRegisterForm(overrides: Record<string, any> = {}): FormData {
    const form = new FormData()
    const defaults: Record<string, any> = {
        name: "New User",
        email: `register-${Date.now()}@example.com`,
        password: "password123",
    }
    const merged = { ...defaults, ...overrides }
    for (const [key, value] of Object.entries(merged)) {
        if (value !== undefined && value !== null) {
            form.append(key, value)
        }
    }
    return form
}

describe("Auth Module", () => {
    let testUser: User
    let userToken: string

    beforeAll(async () => {
        testUser = await createTestUser()
        userToken = await generateUserToken(testUser)
    })

    afterAll(async () => {
        // Cleanup any leftover reset tokens
        if (testUser?.id) {
            await AppDataSource.getRepository(PasswordResetToken).delete({ userId: testUser.id })
            await cleanupTestUser(testUser.id)
        }
    })

    describe("POST /auth/register", () => {
        let createdUserIds: number[] = []

        afterAll(async () => {
            for (const id of createdUserIds) {
                await cleanupTestUser(id)
            }
        })

        it("should register a new user with valid data", async () => {
            const form = buildRegisterForm()
            const res = await formRequest("/auth/register", form)
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
            expect(res.body.data.id).toBeDefined()
            if (res.body.data?.id) createdUserIds.push(res.body.data.id)
        })

        it("should register via JSON payload", async () => {
            const res = await request("/auth/register", {
                method: "POST",
                body: {
                    name: "JSON User",
                    email: `json-register-${Date.now()}@example.com`,
                    password: "password123",
                },
            })
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
            if (res.body.data?.id) createdUserIds.push(res.body.data.id)
        })

        it("should fail with missing email", async () => {
            const res = await request("/auth/register", {
                method: "POST",
                body: { name: "Test User", password: "password123" },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with invalid email format", async () => {
            const form = buildRegisterForm({ email: "not-an-email" })
            const res = await formRequest("/auth/register", form)
            expect(res.status).toBe(422)
        })

        it("should fail with duplicate email", async () => {
            const form = buildRegisterForm({ email: testUser.email })
            const res = await formRequest("/auth/register", form)
            expect(res.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail with empty body", async () => {
            const res = await formRequest("/auth/register", new FormData())
            expect(res.status).toBe(422)
        })
    })

    describe("GET /auth/verify-email", () => {
        let verifyUserId: number | null = null

        afterAll(async () => {
            if (verifyUserId) {
                await AppDataSource.getRepository("EmailVerificationToken").delete({ userId: verifyUserId })
                await cleanupTestUser(verifyUserId)
            }
        })

        it("should verify email with valid token and return auth tokens", async () => {
            // Create unverified user directly
            const userRepo = AppDataSource.getRepository(User)
            const user = userRepo.create({
                firstName: "Verify",
                lastName: "Test",
                email: `verify-${Date.now()}@example.com`,
                phone: `08${Date.now().toString().slice(-10)}`,
                status: null,
                isVerified: false,
            })
            const savedUser = await userRepo.save(user)
            verifyUserId = savedUser.id

            // Create verification token
            const tokenRepo = AppDataSource.getRepository("EmailVerificationToken")
            const token = `test-token-${Date.now()}`
            await tokenRepo.save({
                userId: savedUser.id,
                token,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            })

            const res = await request(`/auth/verify-email?token=${token}`)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.accessToken).toBeDefined()
            expect(res.body.data.refreshToken).toBeDefined()
            expect(res.body.data.user).toBeDefined()
            expect(res.body.data.user.email).toBe(savedUser.email)

            // Verify user is now verified and active
            const updatedUser = await userRepo.findOneBy({ id: savedUser.id })
            expect(updatedUser?.isVerified).toBe(true)
            expect(updatedUser?.status).toBeNull()
        })

        it("should fail with missing token", async () => {
            const res = await request("/auth/verify-email")
            expect(res.status).toBe(400)
        })

        it("should fail with invalid token", async () => {
            const res = await request("/auth/verify-email?token=invalid-token-xxx")
            expect(res.status).toBe(400)
        })

        it("should fail with expired token", async () => {
            // Create expired token
            if (verifyUserId) {
                const userRepo = AppDataSource.getRepository(User)
                await userRepo.update(verifyUserId, { isVerified: false })

                const tokenRepo = AppDataSource.getRepository("EmailVerificationToken")
                const token = `expired-token-${Date.now()}`
                await tokenRepo.save({
                    userId: verifyUserId,
                    token,
                    expiresAt: new Date(Date.now() - 1000), // already expired
                })

                const res = await request(`/auth/verify-email?token=${token}`)
                expect(res.status).toBe(400)
            }
        })
    })

    describe("POST /auth/resend-verification", () => {
        let resendUserId: number | null = null
        let resendUserEmail: string

        beforeAll(async () => {
            const userRepo = AppDataSource.getRepository(User)
            resendUserEmail = `resend-${Date.now()}@example.com`
            const user = userRepo.create({
                firstName: "Resend",
                lastName: "Test",
                email: resendUserEmail,
                phone: `08${Date.now().toString().slice(-10)}`,
                status: null,
                isVerified: false,
            })
            const savedUser = await userRepo.save(user)
            resendUserId = savedUser.id
        })

        afterAll(async () => {
            if (resendUserId) {
                await AppDataSource.getRepository("EmailVerificationToken").delete({ userId: resendUserId })
                await cleanupTestUser(resendUserId)
            }
        })

        it("should fail with non-existent email", async () => {
            const res = await request("/auth/resend-verification", {
                method: "POST",
                body: { email: "nonexistent@example.com" },
            })
            expect(res.status).toBe(400)
        })

        it("should fail with already verified email", async () => {
            // Make user verified
            const userRepo = AppDataSource.getRepository(User)
            await userRepo.update(resendUserId!, { isVerified: true })

            const res = await request("/auth/resend-verification", {
                method: "POST",
                body: { email: resendUserEmail },
            })
            expect(res.status).toBe(400)

            // Reset for other tests
            await userRepo.update(resendUserId!, { isVerified: false })
        })

        it("should fail with invalid email format", async () => {
            const res = await request("/auth/resend-verification", {
                method: "POST",
                body: { email: "not-an-email" },
            })
            expect(res.status).toBe(422)
        })
    })

    describe("GET /auth/check-email-status", () => {
        let checkUserId: number | null = null
        let checkUserEmail: string

        beforeAll(async () => {
            const userRepo = AppDataSource.getRepository(User)
            checkUserEmail = `check-${Date.now()}@example.com`
            const user = userRepo.create({
                firstName: "Check",
                lastName: "Test",
                email: checkUserEmail,
                phone: `08${Date.now().toString().slice(-10)}`,
                status: null,
                isVerified: false,
            })
            const savedUser = await userRepo.save(user)
            checkUserId = savedUser.id
        })

        afterAll(async () => {
            if (checkUserId) await cleanupTestUser(checkUserId)
        })

        it("should return needsVerification for unverified email", async () => {
            const res = await request(`/auth/check-email-status?email=${checkUserEmail}`)
            expect(res.status).toBe(200)
            expect(res.body.data.needsVerification).toBe(true)
        })

        it("should fail with already verified email", async () => {
            const userRepo = AppDataSource.getRepository(User)
            await userRepo.update(checkUserId!, { isVerified: true })

            const res = await request(`/auth/check-email-status?email=${checkUserEmail}`)
            expect(res.status).toBe(400)

            await userRepo.update(checkUserId!, { isVerified: false })
        })

        it("should fail with non-existent email", async () => {
            const res = await request("/auth/check-email-status?email=nonexistent@example.com")
            expect(res.status).toBe(400)
        })

        it("should fail with missing email", async () => {
            const res = await request("/auth/check-email-status")
            expect(res.status).toBe(400)
        })
    })

    describe("POST /auth/login", () => {
        it("should login with email and correct password", async () => {
            const res = await request("/auth/login", {
                method: "POST",
                body: { identifier: testUser.email, password: "password123" },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.accessToken).toBeDefined()
            expect(res.body.data.refreshToken).toBeDefined()
        })

        it("should fail with wrong password", async () => {
            const res = await request("/auth/login", {
                method: "POST",
                body: { identifier: testUser.email, password: "wrongpass" },
            })
            expect(res.status).toBe(401)
        })

        it("should fail with non-existent user", async () => {
            const res = await request("/auth/login", {
                method: "POST",
                body: { identifier: "nobody@example.com", password: "password123" },
            })
            expect(res.status).toBe(401)
        })

        it("should fail with missing identifier", async () => {
            const res = await request("/auth/login", {
                method: "POST",
                body: { password: "password123" },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with missing password", async () => {
            const res = await request("/auth/login", {
                method: "POST",
                body: { identifier: testUser.email },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with empty body", async () => {
            const res = await request("/auth/login", { method: "POST", body: {} })
            expect(res.status).toBe(422)
        })
    })

    describe("GET /auth/me", () => {
        it("should return current user with valid token", async () => {
            const res = await authRequest("/auth/me", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.id).toBe(testUser.id)
            expect(res.body.data.email).toBe(testUser.email)
        })

        it("should fail without token", async () => {
            const res = await request("/auth/me")
            expect(res.status).toBe(401)
        })

        it("should fail with invalid token", async () => {
            const res = await authRequest("/auth/me", "invalid.jwt.token")
            expect(res.status).toBe(401)
        })

        it("should fail with expired token format", async () => {
            const res = await authRequest("/auth/me", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjk5OTk5fQ.invalid")
            expect(res.status).toBe(401)
        })
    })

    describe("POST /auth/refresh", () => {
        it("should refresh tokens with valid refresh token", async () => {
            const loginRes = await request("/auth/login", {
                method: "POST",
                body: { identifier: testUser.email, password: "password123" },
            })
            const refreshToken = loginRes.body.data.refreshToken

            const res = await request("/auth/refresh", {
                method: "POST",
                body: { refreshToken },
            })
            expect(res.status).toBe(200)
            expect(res.body.data.accessToken).toBeDefined()
        })

        it("should fail with invalid refresh token", async () => {
            const res = await request("/auth/refresh", {
                method: "POST",
                body: { refreshToken: "invalid-token" },
            })
            expect(res.status).toBe(401)
        })

        it("should fail with missing refreshToken field", async () => {
            const res = await request("/auth/refresh", { method: "POST", body: {} })
            expect(res.status).toBe(422)
        })
    })

    describe("POST /auth/forgot-password", () => {
        afterAll(async () => {
            // Cleanup reset tokens created by these tests
            if (testUser?.id) {
                await AppDataSource.getRepository(PasswordResetToken).delete({ userId: testUser.id })
            }
        })

        it("should send reset email and create token in database", async () => {
            const res = await request("/auth/forgot-password", {
                method: "POST",
                body: { email: testUser.email },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)

            // Verify token was created in the password_reset_tokens table
            const tokens = await AppDataSource.getRepository(PasswordResetToken).find({
                where: { userId: testUser.id },
            })
            expect(tokens.length).toBeGreaterThanOrEqual(1)
        })

        it("should create multiple tokens for multiple requests", async () => {
            // Clear existing tokens first
            await AppDataSource.getRepository(PasswordResetToken).delete({ userId: testUser.id })

            // Make two forgot-password requests
            await request("/auth/forgot-password", {
                method: "POST",
                body: { email: testUser.email },
            })
            await request("/auth/forgot-password", {
                method: "POST",
                body: { email: testUser.email },
            })

            // Verify multiple tokens exist
            const tokens = await AppDataSource.getRepository(PasswordResetToken).find({
                where: { userId: testUser.id },
            })
            expect(tokens.length).toBe(2)
        })

        it("should fail with non-existent email", async () => {
            const res = await request("/auth/forgot-password", {
                method: "POST",
                body: { email: "nonexistent@example.com" },
            })
            expect(res.status).toBe(400)
        })

        it("should fail with invalid email format", async () => {
            const res = await request("/auth/forgot-password", {
                method: "POST",
                body: { email: "not-email" },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with missing email", async () => {
            const res = await request("/auth/forgot-password", { method: "POST", body: {} })
            expect(res.status).toBe(422)
        })

        it("should fail with unverified email", async () => {
            const userRepo = AppDataSource.getRepository(User)
            const unverifiedUser = await userRepo.save(userRepo.create({
                firstName: "Unverified",
                lastName: "Forgot",
                email: `unverified-forgot-${Date.now()}@example.com`,
                phone: `08${Date.now().toString().slice(-10)}`,
                password: "hashed",
                status: UserStatus.ACTIVE,
                isVerified: false,
            }))

            const res = await request("/auth/forgot-password", {
                method: "POST",
                body: { email: unverifiedUser.email },
            })
            expect(res.status).toBe(400)

            await userRepo.delete(unverifiedUser.id)
        })
    })

    describe("GET /auth/validate-reset-token", () => {
        let validToken: string

        beforeAll(async () => {
            // Clear and create a fresh token
            await AppDataSource.getRepository(PasswordResetToken).delete({ userId: testUser.id })
            const tokenEntity = AppDataSource.getRepository(PasswordResetToken).create({
                userId: testUser.id,
                token: "test-valid-token-" + Date.now(),
                expiresAt: new Date(Date.now() + 36000000),
            })
            const saved = await AppDataSource.getRepository(PasswordResetToken).save(tokenEntity)
            validToken = saved.token
        })

        afterAll(async () => {
            await AppDataSource.getRepository(PasswordResetToken).delete({ userId: testUser.id })
        })

        it("should validate a valid token", async () => {
            const res = await request(`/auth/validate-reset-token?token=${validToken}`)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail with missing token query", async () => {
            const res = await request("/auth/validate-reset-token")
            expect(res.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail with invalid token", async () => {
            const res = await request(`/auth/validate-reset-token?token=invalid-token`)
            expect(res.status).toBe(400)
        })

        it("should fail with expired token", async () => {
            // Create an expired token
            const expiredTokenEntity = AppDataSource.getRepository(PasswordResetToken).create({
                userId: testUser.id,
                token: "expired-token-" + Date.now(),
                expiresAt: new Date(Date.now() - 1000), // already expired
            })
            const saved = await AppDataSource.getRepository(PasswordResetToken).save(expiredTokenEntity)

            const res = await request(`/auth/validate-reset-token?token=${saved.token}`)
            expect(res.status).toBe(400)
        })
    })

    describe("POST /auth/reset-password", () => {
        it("should reset password with valid token and delete all tokens", async () => {
            // Create multiple tokens for the user
            const tokenRepo = AppDataSource.getRepository(PasswordResetToken)
            await tokenRepo.delete({ userId: testUser.id })

            const token1 = tokenRepo.create({
                userId: testUser.id,
                token: "reset-token-1-" + Date.now(),
                expiresAt: new Date(Date.now() + 36000000),
            })
            const token2 = tokenRepo.create({
                userId: testUser.id,
                token: "reset-token-2-" + Date.now(),
                expiresAt: new Date(Date.now() + 36000000),
            })
            await tokenRepo.save([token1, token2])

            // Reset password using token1
            const res = await request("/auth/reset-password", {
                method: "POST",
                body: { token: token1.token, newPassword: "newpassword123" },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)

            // Verify ALL tokens for this user are deleted
            const remainingTokens = await tokenRepo.find({ where: { userId: testUser.id } })
            expect(remainingTokens.length).toBe(0)

            // Verify login works with new password
            const loginRes = await request("/auth/login", {
                method: "POST",
                body: { identifier: testUser.email, password: "newpassword123" },
            })
            expect(loginRes.status).toBe(200)

            // Restore original password for other tests
            await request("/auth/reset-password", {
                method: "POST",
                // This will fail since tokens are deleted, so we create a new one
            }).catch(() => {})

            // Create a new token and reset back to original password
            const restoreToken = tokenRepo.create({
                userId: testUser.id,
                token: "restore-token-" + Date.now(),
                expiresAt: new Date(Date.now() + 36000000),
            })
            await tokenRepo.save(restoreToken)
            await request("/auth/reset-password", {
                method: "POST",
                body: { token: restoreToken.token, newPassword: "password123" },
            })
        })

        it("should fail with invalid token", async () => {
            const res = await request("/auth/reset-password", {
                method: "POST",
                body: { token: "invalid-token", newPassword: "newpassword123" },
            })
            expect(res.status).toBe(400)
        })

        it("should fail with expired token", async () => {
            const tokenRepo = AppDataSource.getRepository(PasswordResetToken)
            const expiredToken = tokenRepo.create({
                userId: testUser.id,
                token: "expired-reset-" + Date.now(),
                expiresAt: new Date(Date.now() - 1000),
            })
            await tokenRepo.save(expiredToken)

            const res = await request("/auth/reset-password", {
                method: "POST",
                body: { token: expiredToken.token, newPassword: "newpassword123" },
            })
            expect(res.status).toBe(400)

            // Cleanup
            await tokenRepo.delete({ id: expiredToken.id })
        })

        it("should fail with missing fields", async () => {
            const res = await request("/auth/reset-password", { method: "POST", body: {} })
            expect(res.status).toBe(422)
        })

        it("should fail with mismatched passwords", async () => {
            const res = await request("/auth/reset-password", {
                method: "POST",
                body: { token: "some-token", password: "newpass123", passwordConfirmation: "different" },
            })
            expect(res.status).toBe(422)
        })
    })

    describe("POST /auth/logout", () => {
        it("should logout successfully", async () => {
            const res = await authRequest("/auth/logout", userToken, { method: "POST" })
            expect(res.status).toBe(200)
        })

        it("should fail without auth", async () => {
            const res = await request("/auth/logout", { method: "POST" })
            expect(res.status).toBe(401)
        })
    })

    describe("POST /auth/otp/send", () => {
        it("should send OTP to email", async () => {
            const res = await request("/auth/otp/send", {
                method: "POST",
                body: { identifier: testUser.email },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.type).toBe("email")
        })

        it("should send OTP to phone", async () => {
            const res = await request("/auth/otp/send", {
                method: "POST",
                body: { identifier: testUser.phone },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.type).toBe("phone")
        })

        it("should fail with non-existent user", async () => {
            const res = await request("/auth/otp/send", {
                method: "POST",
                body: { identifier: "nonexistent@example.com" },
            })
            expect(res.status).toBe(400)
        })

        it("should fail with missing identifier", async () => {
            const res = await request("/auth/otp/send", {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(422)
        })
    })

    describe("POST /auth/otp/verify", () => {
        it("should verify OTP and return auth tokens", async () => {
            // Create OTP token directly
            const otpRepo = AppDataSource.getRepository("OtpToken")
            await otpRepo.delete({ userId: testUser.id })
            await otpRepo.save({
                userId: testUser.id,
                code: "123456",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            })

            const res = await request("/auth/otp/verify", {
                method: "POST",
                body: { identifier: testUser.email, code: "123456" },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.accessToken).toBeDefined()
            expect(res.body.data.refreshToken).toBeDefined()
            expect(res.body.data.user).toBeDefined()
            expect(res.body.data.user.email).toBe(testUser.email)
        })

        it("should fail with invalid OTP code", async () => {
            const res = await request("/auth/otp/verify", {
                method: "POST",
                body: { identifier: testUser.email, code: "999999" },
            })
            expect(res.status).toBe(400)
        })

        it("should fail with expired OTP", async () => {
            const otpRepo = AppDataSource.getRepository("OtpToken")
            await otpRepo.delete({ userId: testUser.id })
            await otpRepo.save({
                userId: testUser.id,
                code: "654321",
                expiresAt: new Date(Date.now() - 1000), // expired
            })

            const res = await request("/auth/otp/verify", {
                method: "POST",
                body: { identifier: testUser.email, code: "654321" },
            })
            expect(res.status).toBe(400)
        })

        it("should fail with missing fields", async () => {
            const res = await request("/auth/otp/verify", {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(422)
        })
    })
})

