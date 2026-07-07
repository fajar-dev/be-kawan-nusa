import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest } from "../helpers/test-client"
import { createTestAdminNoPermissions, generateAdminToken, cleanupTestAdmin } from "../helpers/auth.helper"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Permission Enforcement", () => {
    let noPermAdmin: Employee
    let noPermToken: string

    beforeAll(async () => {
        noPermAdmin = await createTestAdminNoPermissions()
        noPermToken = await generateAdminToken(noPermAdmin)
    })

    afterAll(async () => {
        if (noPermAdmin?.id) await cleanupTestAdmin(noPermAdmin.id)
    })

    // Test each module - admin with no permissions should get 403
    describe("Dashboard", () => {
        it("should deny GET /statistic/admin/summary without dashboard:L permission", async () => {
            const res = await authRequest("/statistic/admin/summary", noPermToken)
            expect(res.status).toBe(403)
        })
    })

    describe("User", () => {
        it("should deny GET /user without user:L permission", async () => {
            const res = await authRequest("/user", noPermToken)
            expect(res.status).toBe(403)
        })

        it("should deny PATCH /user/1/status without user:E permission", async () => {
            const res = await authRequest("/user/1/status", noPermToken, {
                method: "PATCH",
                body: { status: "active" },
            })
            expect(res.status).toBe(403)
        })
    })

    describe("Point Submission", () => {
        it("should deny GET /point-submission without point-submission:L permission", async () => {
            const res = await authRequest("/point-submission", noPermToken)
            expect(res.status).toBe(403)
        })

        it("should deny POST /point-submission without point-submission:T permission", async () => {
            const res = await authRequest("/point-submission", noPermToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(403)
        })

        it("should deny DELETE /point-submission/1 without point-submission:H permission", async () => {
            const res = await authRequest("/point-submission/1", noPermToken, {
                method: "DELETE",
            })
            expect(res.status).toBe(403)
        })
    })

    describe("Redemption Cash", () => {
        it("should deny GET /redemption/cash/list without redemption.cash:L permission", async () => {
            const res = await authRequest("/redemption/cash/list", noPermToken)
            expect(res.status).toBe(403)
        })
    })

    describe("Redemption Product", () => {
        it("should deny GET /redemption/product/list without redemption.product:L permission", async () => {
            const res = await authRequest("/redemption/product/list", noPermToken)
            expect(res.status).toBe(403)
        })
    })

    describe("Redemption Voucher", () => {
        it("should deny GET /redemption/voucher/list without redemption.voucher:L permission", async () => {
            const res = await authRequest("/redemption/voucher/list", noPermToken)
            expect(res.status).toBe(403)
        })
    })

    describe("Catalog", () => {
        it("should deny POST /catalog without catalog:T permission", async () => {
            const res = await authRequest("/catalog", noPermToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(403)
        })

        it("should deny DELETE /catalog/1 without catalog:H permission", async () => {
            const res = await authRequest("/catalog/1", noPermToken, {
                method: "DELETE",
            })
            expect(res.status).toBe(403)
        })
    })

    describe("Education", () => {
        it("should deny POST /education/category without education:T permission", async () => {
            const res = await authRequest("/education/category", noPermToken, {
                method: "POST",
                body: { name: "test" },
            })
            expect(res.status).toBe(403)
        })

        it("should deny POST /education/article without education:T permission", async () => {
            const res = await authRequest("/education/article", noPermToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(403)
        })

        it("should deny DELETE /education/category/1 without education:H permission", async () => {
            const res = await authRequest("/education/category/1", noPermToken, {
                method: "DELETE",
            })
            expect(res.status).toBe(403)
        })

        it("should deny POST /service/promotion without education:T permission", async () => {
            const res = await authRequest("/service/promotion", noPermToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(403)
        })

        it("should deny POST /template without education:T permission", async () => {
            const res = await authRequest("/template", noPermToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(403)
        })
    })

    describe("Role", () => {
        it("should deny GET /role without role:L permission", async () => {
            const res = await authRequest("/role", noPermToken)
            expect(res.status).toBe(403)
        })

        it("should deny POST /role without role:T permission", async () => {
            const res = await authRequest("/role", noPermToken, {
                method: "POST",
                body: { name: "test", permissions: {} },
            })
            expect(res.status).toBe(403)
        })

        it("should deny DELETE /role/1 without role:H permission", async () => {
            const res = await authRequest("/role/1", noPermToken, {
                method: "DELETE",
            })
            expect(res.status).toBe(403)
        })
    })
})
