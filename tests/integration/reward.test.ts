import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, generateUserToken, cleanupTestUser } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { config } from "../../src/config/config"

describe("Point Module (Reward)", () => {
    let testUser: User
    let userToken: string

    beforeAll(async () => {
        testUser = await createTestUser()
        userToken = await generateUserToken(testUser)
    })

    afterAll(async () => {
        if (testUser?.id) await cleanupTestUser(testUser.id)
    })

    describe("GET /point/reward", () => {
        it("should return rewards list", async () => {
            const res = await authRequest("/point/reward", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest("/point/reward?page=1&limit=5", userToken)
            expect(res.status).toBe(200)
        })

        it("should fail without auth", async () => {
            const res = await request("/point/reward")
            expect(res.status).toBe(401)
        })
    })

    describe("POST /point/reward", () => {
        it("should fail without api key (401)", async () => {
            const res = await request("/point/reward", {
                method: "POST",
                body: {
                    customerServiceId: 1,
                    userId: testUser.id,
                    price: 100000,
                    point: 100,
                    type: "OTC",
                },
            })
            expect(res.status).toBe(401)
        })

        it("should fail with invalid api key (401)", async () => {
            const res = await request("/point/reward", {
                method: "POST",
                headers: { "x-api-key": "wrong-key" },
                body: {
                    customerServiceId: 1,
                    userId: testUser.id,
                    price: 100000,
                    point: 100,
                    type: "OTC",
                },
            })
            expect(res.status).toBe(401)
        })

        it("should fail with invalid body (422)", async () => {
            const res = await request("/point/reward", {
                method: "POST",
                headers: { "x-api-key": config.app.apiKey },
                body: {},
            })
            expect(res.status).toBe(422)
        })

        it("should fail without userId (422)", async () => {
            const res = await request("/point/reward", {
                method: "POST",
                headers: { "x-api-key": config.app.apiKey },
                body: {
                    customerServiceId: 1,
                    price: 100000,
                    point: 100,
                    type: "OTC",
                },
            })
            expect(res.status).toBe(422)
        })

        it("should fail with non-existent customerServiceId (404)", async () => {
            const res = await request("/point/reward", {
                method: "POST",
                headers: { "x-api-key": config.app.apiKey },
                body: {
                    customerServiceId: 999999,
                    userId: testUser.id,
                    price: 100000,
                    point: 100,
                    type: "OTC",
                },
            })
            expect(res.status).toBe(404)
        })
    })
})
