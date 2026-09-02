import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { AppDataSource } from "../../src/config/database"
import { Branch } from "../../src/modules/branch/entities/branch.entity"

describe("Branch (Additional Data)", () => {
    let testUser: User
    let testAdmin: Employee
    let userToken: string
    let adminToken: string
    let testBranch: Branch

    beforeAll(async () => {
        testUser = await createTestUser()
        testAdmin = await createTestAdmin()
        userToken = await generateUserToken(testUser)
        adminToken = await generateAdminToken(testAdmin)

        testBranch = await AppDataSource.getRepository(Branch).save({
            code: `TEST-${Date.now()}`,
            name: "Test Branch",
        })
    })

    afterAll(async () => {
        if (testBranch?.id) await AppDataSource.getRepository(Branch).delete(testBranch.id)
        if (testUser?.id) await cleanupTestUser(testUser.id)
        if (testAdmin?.id) await cleanupTestAdmin(testAdmin.id)
    })

    describe("GET /additional/branch", () => {
        it("should return branch list as user", async () => {
            const res = await authRequest("/additional/branch", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            const found = res.body.data.find((b: any) => b.id === testBranch.id)
            expect(found).toEqual({ id: testBranch.id, code: testBranch.code, name: testBranch.name })
        })

        it("should return branch list as admin", async () => {
            const res = await authRequest("/additional/branch", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail without token", async () => {
            const res = await request("/additional/branch")
            expect(res.status).toBe(401)
        })
    })
})
