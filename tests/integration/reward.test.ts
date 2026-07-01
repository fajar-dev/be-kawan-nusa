import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, generateUserToken, cleanupTestUser } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"

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
})
