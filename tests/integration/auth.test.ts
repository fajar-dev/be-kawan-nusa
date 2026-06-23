import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest } from "../helpers/test-client"
import { createTestUser, generateUserToken, cleanupTestUser } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"

describe("Auth Module", () => {
    let testUser: User
    let userToken: string

    beforeAll(async () => {
        testUser = await createTestUser()
        userToken = await generateUserToken(testUser)
    })

    afterAll(async () => {
        if (testUser?.id) await cleanupTestUser(testUser.id)
    })

    describe("POST /auth/register", () => {
        let createdUserId: number | null = null

        afterAll(async () => {
            if (createdUserId) await cleanupTestUser(createdUserId)
        })

        it("should register a new user with valid data", async () => {
            const res = await request("/auth/register", {
                method: "POST",
                body: {
                    firstName: "New",
                    lastName: "User",
                    email: `register-${Date.now()}@example.com`,
                    phone: `08${Date.now().toString().slice(-10)}`,
                    password: "password123",
                    passwordConfirmation: "password123",
                },
            })
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
            if (res.body.data?.id) createdUserId = res.body.data.id
        })

        it("should fail with missing required fields", async () => {
            const res = await request("/auth/register", {
                method: "POST",
                body: { firstName: "Only" },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with invalid email format", async () => {
            const res = await request("/auth/register", {
                method: "POST",
                body: {
                    firstName: "Bad",
                    lastName: "Email",
                    email: "not-an-email",
                    phone: "081234567890",
                    password: "password123",
                    passwordConfirmation: "password123",
                },
            })
            expect(res.status).toBe(422)
        })

        it("should fail when password too short", async () => {
            const res = await request("/auth/register", {
                method: "POST",
                body: {
                    firstName: "Short",
                    lastName: "Pass",
                    email: `short-${Date.now()}@example.com`,
                    phone: `08${Date.now().toString().slice(-10)}`,
                    password: "12",
                    passwordConfirmation: "12",
                },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with empty firstName", async () => {
            const res = await request("/auth/register", {
                method: "POST",
                body: {
                    firstName: "",
                    lastName: "User",
                    email: `empty-${Date.now()}@example.com`,
                    phone: `08${Date.now().toString().slice(-10)}`,
                    password: "password123",
                },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with duplicate email", async () => {
            const res = await request("/auth/register", {
                method: "POST",
                body: {
                    firstName: "Dup",
                    lastName: "User",
                    email: testUser.email,
                    phone: `08${Date.now().toString().slice(-10)}`,
                    password: "password123",
                    passwordConfirmation: "password123",
                },
            })
            expect(res.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail with empty body", async () => {
            const res = await request("/auth/register", { method: "POST", body: {} })
            expect(res.status).toBe(422)
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
    })

    describe("POST /auth/reset-password", () => {
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

    describe("GET /auth/validate-reset-token", () => {
        it("should fail with missing token query", async () => {
            const res = await request("/auth/validate-reset-token")
            expect(res.status).toBeGreaterThanOrEqual(400)
        })

        it("should fail with invalid token", async () => {
            const res = await request("/auth/validate-reset-token?token=invalid-token")
            expect(res.status).toBeGreaterThanOrEqual(400)
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
})
