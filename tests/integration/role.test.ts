import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { AppDataSource } from "../../src/config/database"
import { Role } from "../../src/modules/role/entities/role.entity"

describe("Role Module", () => {
    let testUser: User
    let testAdmin: Employee
    let userToken: string
    let adminToken: string
    let createdRoleId: number | null = null

    beforeAll(async () => {
        testUser = await createTestUser()
        testAdmin = await createTestAdmin()
        userToken = await generateUserToken(testUser)
        adminToken = await generateAdminToken(testAdmin)
    })

    afterAll(async () => {
        // Cleanup created role
        if (createdRoleId) {
            try {
                await AppDataSource.getRepository(Role).delete(createdRoleId)
            } catch (_) {}
        }
        if (testUser?.id) await cleanupTestUser(testUser.id)
        if (testAdmin?.id) await cleanupTestAdmin(testAdmin.id)
    })

    // GET /role — list roles
    describe("GET /role", () => {
        it("should return role list for admin", async () => {
            const res = await authRequest("/role", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest("/role?page=1&limit=5", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support search filter", async () => {
            const res = await authRequest("/role?q=test", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/role", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/role")
            expect(res.status).toBe(401)
        })
    })

    // POST /role — create role
    describe("POST /role", () => {
        it("should create a role", async () => {
            const res = await authRequest("/role", adminToken, {
                method: "POST",
                body: {
                    name: `Test Role ${Date.now()}`,
                    description: "Test role description",
                    color: "#FF5733",
                    permissions: {
                        dashboard: ["L"],
                        user: ["L", "T"],
                    },
                },
            })
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
            expect(res.body.data).toHaveProperty("id")
            expect(res.body.data).toHaveProperty("name")
            expect(res.body.data).toHaveProperty("permissions")
            expect(res.body.data).toHaveProperty("employeeCount")
            createdRoleId = res.body.data.id
        })

        it("should fail with duplicate name", async () => {
            if (!createdRoleId) return

            // Get the created role name first
            const showRes = await authRequest(`/role/${createdRoleId}`, adminToken)
            if (showRes.status !== 200) return

            const res = await authRequest("/role", adminToken, {
                method: "POST",
                body: {
                    name: showRes.body.data.name,
                    permissions: { dashboard: ["L"] },
                },
            })
            expect(res.status).toBe(400)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/role", userToken, {
                method: "POST",
                body: {
                    name: "Unauthorized Role",
                    permissions: {},
                },
            })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/role", {
                method: "POST",
                body: {
                    name: "No Auth Role",
                    permissions: {},
                },
            })
            expect(res.status).toBe(401)
        })
    })

    // GET /role/:id — show role
    describe("GET /role/:id", () => {
        it("should return a role by id", async () => {
            if (!createdRoleId) return
            const res = await authRequest(`/role/${createdRoleId}`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data).toHaveProperty("id")
            expect(res.body.data).toHaveProperty("name")
            expect(res.body.data).toHaveProperty("permissions")
            expect(res.body.data).toHaveProperty("employeeCount")
        })

        it("should return 404 for non-existent role", async () => {
            const res = await authRequest("/role/999999", adminToken)
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/role/1", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/role/1")
            expect(res.status).toBe(401)
        })
    })

    // PUT /role/:id — update role
    describe("PUT /role/:id", () => {
        it("should update a role", async () => {
            if (!createdRoleId) return
            const res = await authRequest(`/role/${createdRoleId}`, adminToken, {
                method: "PUT",
                body: {
                    description: "Updated description",
                    color: "#00FF00",
                },
            })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should return 404 for non-existent role", async () => {
            const res = await authRequest("/role/999999", adminToken, {
                method: "PUT",
                body: { description: "Test" },
            })
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/role/1", userToken, {
                method: "PUT",
                body: { description: "Test" },
            })
            expect(res.status).toBe(403)
        })
    })

    // DELETE /role/:id — delete role
    describe("DELETE /role/:id", () => {
        it("should return 404 for non-existent role", async () => {
            const res = await authRequest("/role/999999", adminToken, { method: "DELETE" })
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/role/1", userToken, { method: "DELETE" })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/role/1", { method: "DELETE" })
            expect(res.status).toBe(401)
        })

        it("should delete the created role", async () => {
            if (!createdRoleId) return
            const res = await authRequest(`/role/${createdRoleId}`, adminToken, { method: "DELETE" })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            createdRoleId = null // prevent afterAll cleanup
        })
    })

    // GET /role/permission-matrix — permission modules
    describe("GET /role/permission-matrix", () => {
        it("should return permission matrix", async () => {
            const res = await authRequest("/role/permission-matrix", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(Array.isArray(res.body.data)).toBe(true)
            expect(res.body.data.length).toBeGreaterThan(0)

            const first = res.body.data[0]
            expect(first).toHaveProperty("key")
            expect(first).toHaveProperty("label")
            expect(first).toHaveProperty("group")
            expect(first).toHaveProperty("actions")
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/role/permission-matrix", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/role/permission-matrix")
            expect(res.status).toBe(401)
        })
    })
})
