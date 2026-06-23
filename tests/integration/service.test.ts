import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, generateUserToken, cleanupTestUser } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"

describe("Service Module", () => {
    let testUser: User
    let userToken: string

    beforeAll(async () => {
        testUser = await createTestUser()
        userToken = await generateUserToken(testUser)
    })

    afterAll(async () => {
        if (testUser?.id) await cleanupTestUser(testUser.id)
    })

    describe("GET /service", () => {
        it("should return services list", async () => {
            const res = await authRequest("/service", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail without auth", async () => {
            const res = await request("/service")
            expect(res.status).toBe(401)
        })
    })
})
