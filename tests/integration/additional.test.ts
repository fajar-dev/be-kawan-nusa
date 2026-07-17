import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest } from "../helpers/test-client"
import { createTestUser, generateUserToken, cleanupTestUser } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"

describe("Additional Module", () => {
    let testUser: User
    let userToken: string

    beforeAll(async () => {
        testUser = await createTestUser()
        userToken = await generateUserToken(testUser)
    })

    afterAll(async () => {
        if (testUser?.id) await cleanupTestUser(testUser.id)
    })

    describe("GET /additional/service", () => {
        it("should return services list", async () => {
            const res = await authRequest("/additional/service", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail without auth", async () => {
            const res = await request("/additional/service")
            expect(res.status).toBe(401)
        })
    })

    describe("GET /additional/customer-type", () => {
        it("should return customer types", async () => {
            const res = await authRequest("/additional/customer-type", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail without auth", async () => {
            const res = await request("/additional/customer-type")
            expect(res.status).toBe(401)
        })
    })

    describe("GET /additional/customer-service-status", () => {
        it("should return status options", async () => {
            const res = await authRequest("/additional/customer-service-status", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe("GET /additional/point-type", () => {
        it("should return point types", async () => {
            const res = await authRequest("/additional/point-type", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe("GET /additional/service-category", () => {
        it("should return service categories", async () => {
            const res = await authRequest("/additional/service-category", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe("GET /additional/search", () => {
        it("should search with query param", async () => {
            const res = await authRequest("/additional/search?q=test", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should handle empty query", async () => {
            const res = await authRequest("/additional/search", userToken)
            expect(res.status).toBe(200)
        })

        it("should fail without auth", async () => {
            const res = await request("/additional/search?q=test")
            expect(res.status).toBe(401)
        })
    })

    describe("GET /proxy", () => {
        it("should return 400 when the path query is missing", async () => {
            const res = await request("/proxy")
            expect(res.status).toBe(400)
        })
    })
})
