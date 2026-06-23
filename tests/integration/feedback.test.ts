import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, generateUserToken, cleanupTestUser } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"

describe("Feedback Module", () => {
    let testUser: User
    let userToken: string

    beforeAll(async () => {
        testUser = await createTestUser()
        userToken = await generateUserToken(testUser)
    })

    afterAll(async () => {
        if (testUser?.id) await cleanupTestUser(testUser.id)
    })

    describe("GET /feedback", () => {
        it("should return feedback list", async () => {
            const res = await authRequest("/feedback", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail without auth", async () => {
            const res = await request("/feedback")
            expect(res.status).toBe(401)
        })
    })
})
