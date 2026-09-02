import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { AppDataSource } from "../../src/config/database"
import { PointSubmission } from "../../src/modules/point-submission/entities/point-submission.entity"
import { PointSubmissionSchedule } from "../../src/modules/point-submission/entities/point-submission-schedule.entity"
import { JobQueue } from "../../src/core/queue/entities/job-queue.entity"

describe("Point Submission Module", () => {
    let testUser: User
    let testAdmin: Employee
    let userToken: string
    let adminToken: string

    beforeAll(async () => {
        testUser = await createTestUser()
        testAdmin = await createTestAdmin()
        userToken = await generateUserToken(testUser)
        adminToken = await generateAdminToken(testAdmin)
    })

    afterAll(async () => {
        if (testUser?.id) await cleanupTestUser(testUser.id)
        if (testAdmin?.id) await cleanupTestAdmin(testAdmin.id)
    })

    // ── List ──────────────────────────────────────────────────────────────

    describe("GET /point-submission", () => {
        it("should return submission list for admin", async () => {
            const res = await authRequest("/point-submission", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest("/point-submission?page=1&limit=5", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support search filter", async () => {
            const res = await authRequest("/point-submission?q=test", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support status filter", async () => {
            const res = await authRequest("/point-submission?status=pending", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support type filter", async () => {
            const res = await authRequest("/point-submission?type=OTC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support date range filter", async () => {
            const res = await authRequest("/point-submission?startDate=2024-01-01&endDate=2030-12-31", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        describe("nisData filters (branchCode / serviceCode / salesEmployeeId)", () => {
            let filterSubmissionId: number

            beforeAll(async () => {
                const saved = await AppDataSource.getRepository(PointSubmission).save({
                    userId: testUser.id,
                    createdById: testAdmin.id,
                    type: "OTC" as any,
                    price: 5000,
                    point: 5,
                    status: "pending" as any,
                    nisData: {
                        custServId: 800000 + Math.floor(Math.random() * 90000),
                        custId: "CUST-FILTER",
                        accountName: "Filter Test Account",
                        serviceCode: "SVC-FILTER",
                        serviceName: "Filter Service",
                        accountManager: "Filter AM",
                        salesEmployeeId: "EMP-FILTER",
                        branchCode: "999",
                    },
                })
                filterSubmissionId = saved.id
            })

            afterAll(async () => {
                if (filterSubmissionId) await AppDataSource.getRepository(PointSubmission).delete(filterSubmissionId)
            })

            it("should filter by branchCode", async () => {
                const res = await authRequest("/point-submission?branchCode[]=999", adminToken)
                expect(res.status).toBe(200)
                expect(res.body.data.some((s: any) => s.id === filterSubmissionId)).toBe(true)
            })

            it("should exclude non-matching branchCode", async () => {
                const res = await authRequest("/point-submission?branchCode[]=000-does-not-exist", adminToken)
                expect(res.status).toBe(200)
                expect(res.body.data.some((s: any) => s.id === filterSubmissionId)).toBe(false)
            })

            it("should filter by serviceCode", async () => {
                const res = await authRequest("/point-submission?serviceCode[]=SVC-FILTER", adminToken)
                expect(res.status).toBe(200)
                expect(res.body.data.some((s: any) => s.id === filterSubmissionId)).toBe(true)
            })

            it("should filter by salesEmployeeId", async () => {
                const res = await authRequest("/point-submission?salesEmployeeId[]=EMP-FILTER", adminToken)
                expect(res.status).toBe(200)
                expect(res.body.data.some((s: any) => s.id === filterSubmissionId)).toBe(true)
            })

            it("should support multiple values for the same filter", async () => {
                const res = await authRequest("/point-submission?branchCode[]=999&branchCode[]=888", adminToken)
                expect(res.status).toBe(200)
                expect(res.body.data.some((s: any) => s.id === filterSubmissionId)).toBe(true)
            })
        })

        it("should support sorting", async () => {
            const res = await authRequest("/point-submission?sort=createdAt&order=ASC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support sorting by nisData.branchCode", async () => {
            const res = await authRequest("/point-submission?sort=branchCode&order=ASC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support sorting by nisData.custId", async () => {
            const res = await authRequest("/point-submission?sort=custId&order=ASC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should support sorting by nisData.serviceName", async () => {
            const res = await authRequest("/point-submission?sort=serviceName&order=DESC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission")
            expect(res.status).toBe(401)
        })
    })

    // ── Detail ─────────────────────────────────────────────────────────────

    describe("GET /point-submission/:id", () => {
        it("should return 404 for non-existent", async () => {
            const res = await authRequest("/point-submission/999999", adminToken)
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission/1", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission/1")
            expect(res.status).toBe(401)
        })
    })

    // ── Check Account ──────────────────────────────────────────────────────

    describe("GET /point-submission/check-account", () => {
        it("should return result for admin", async () => {
            const res = await authRequest("/point-submission/check-account?custServId=999999&userId=1", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission/check-account?custServId=1", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission/check-account?custServId=1")
            expect(res.status).toBe(401)
        })
    })

    // ── Create ─────────────────────────────────────────────────────────────

    describe("POST /point-submission", () => {
        it("should fail with validation error (422)", async () => {
            const res = await authRequest("/point-submission", adminToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(422)
        })

        it("should fail with incomplete data (422)", async () => {
            const res = await authRequest("/point-submission", adminToken, {
                method: "POST",
                body: {
                    userId: 1,
                    // missing required fields
                },
            })
            expect(res.status).toBe(422)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission", userToken, {
                method: "POST",
                body: {
                    userId: 1,
                    type: "OTC",
                    price: 10000,
                    nisData: {
                        custServId: 1,
                        custId: "CUST001",
                        accountName: "Test Account",
                        serviceCode: "SVC001",
                        serviceName: "Internet",
                        accountManager: null,
                        salesEmployeeId: null,
                        branchCode: null,
                    },
                },
            })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission", {
                method: "POST",
                body: {
                    userId: 1,
                    type: "OTC",
                    price: 10000,
                },
            })
            expect(res.status).toBe(401)
        })
    })

    // ── Update ─────────────────────────────────────────────────────────────

    describe("PUT /point-submission/:id", () => {
        it("should return 404 for non-existent id", async () => {
            const res = await authRequest("/point-submission/999999", adminToken, {
                method: "PUT",
                body: { price: 20000 },
            })
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission/1", userToken, {
                method: "PUT",
                body: { price: 20000 },
            })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission/1", {
                method: "PUT",
                body: { price: 20000 },
            })
            expect(res.status).toBe(401)
        })
    })

    // ── Delete ─────────────────────────────────────────────────────────────

    describe("DELETE /point-submission/:id", () => {
        it("should return 404 for non-existent id", async () => {
            const res = await authRequest("/point-submission/999999", adminToken, { method: "DELETE" })
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission/1", userToken, { method: "DELETE" })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission/1", { method: "DELETE" })
            expect(res.status).toBe(401)
        })
    })

    // ── Approve ────────────────────────────────────────────────────────────

    describe("POST /point-submission/approve", () => {
        it("should fail with validation error (422) - empty ids", async () => {
            const res = await authRequest("/point-submission/approve", adminToken, {
                method: "POST",
                body: { ids: [] },
            })
            expect(res.status).toBe(422)
        })

        it("should return 404 for non-existent ids", async () => {
            const res = await authRequest("/point-submission/approve", adminToken, {
                method: "POST",
                body: { ids: [999999], notes: "Test approval" },
            })
            expect(res.status).toBe(404)
        })

        it("should fail for user role (403)", async () => {
            const res = await authRequest("/point-submission/approve", userToken, {
                method: "POST",
                body: { ids: [1] },
            })
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/point-submission/approve", {
                method: "POST",
                body: { ids: [1] },
            })
            expect(res.status).toBe(401)
        })
    })

    // ── NIS Account Search ─────────────────────────────────────────────────

    describe("GET /nis/account", () => {
        it("should fail for user role (403)", async () => {
            const res = await authRequest("/nis/account?q=test", userToken)
            expect(res.status).toBe(403)
        })

        it("should fail without auth (401)", async () => {
            const res = await request("/nis/account?q=test")
            expect(res.status).toBe(401)
        })
    })

    // ── Monthly recurring schedule ─────────────────────────────────────────

    describe("Monthly schedule (Bulanan)", () => {
        const custServId = 900000 + Math.floor(Math.random() * 90000)
        let submissionId: number | null = null
        let scheduleId: number | null = null

        const nisData = {
            custServId,
            custId: "CUST-TEST",
            accountName: "Schedule Test Account",
            serviceCode: "SVC-TEST",
            serviceName: "Test Service",
            accountManager: "AM Test",
            salesEmployeeId: null,
            branchCode: null,
        }

        afterAll(async () => {
            if (scheduleId) await AppDataSource.getRepository(PointSubmissionSchedule).delete(scheduleId)
            if (submissionId) {
                await AppDataSource.getRepository(JobQueue).delete({ referenceId: submissionId })
                await AppDataSource.getRepository(PointSubmission).delete(submissionId)
            }
        })

        it("creates an active schedule when a Bulanan submission is approved", async () => {
            // Create a Bulanan submission
            const createRes = await authRequest("/point-submission", adminToken, {
                method: "POST",
                body: { userId: testUser.id, type: "Bulanan", price: 100000, nisData },
            })
            expect(createRes.status).toBe(201)
            submissionId = createRes.body.data.id

            // Approve it → should spawn a schedule
            const approveRes = await authRequest("/point-submission/approve", adminToken, {
                method: "POST",
                body: { ids: [submissionId], notes: "First approval" },
            })
            expect(approveRes.status).toBe(200)

            const schedule = await AppDataSource.getRepository(PointSubmissionSchedule)
                .findOne({ where: { sourceSubmissionId: submissionId! } })
            expect(schedule).not.toBeNull()
            expect(schedule?.isActive).toBe(true)
            expect(schedule?.userId).toBe(testUser.id)
            scheduleId = schedule?.id ?? null
        })

        it("lists the schedule via GET /point-submission/schedule (admin)", async () => {
            const res = await authRequest("/point-submission/schedule?isActive=true", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.some((s: any) => s.id === scheduleId)).toBe(true)
        })

        it("forbids a non-admin from listing schedules (403)", async () => {
            const res = await authRequest("/point-submission/schedule", userToken)
            expect(res.status).toBe(403)
        })

        it("supports search by account name", async () => {
            const res = await authRequest(`/point-submission/schedule?q=${encodeURIComponent("Schedule Test Account")}`, adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data.some((s: any) => s.id === scheduleId)).toBe(true)
        })

        it("filters by serviceCode", async () => {
            const match = await authRequest("/point-submission/schedule?serviceCode[]=SVC-TEST", adminToken)
            expect(match.status).toBe(200)
            expect(match.body.data.some((s: any) => s.id === scheduleId)).toBe(true)

            const noMatch = await authRequest("/point-submission/schedule?serviceCode[]=SVC-DOES-NOT-EXIST", adminToken)
            expect(noMatch.body.data.some((s: any) => s.id === scheduleId)).toBe(false)
        })

        it("excludes a schedule when filtering by a non-matching branchCode", async () => {
            const res = await authRequest("/point-submission/schedule?branchCode[]=999-does-not-exist", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.data.some((s: any) => s.id === scheduleId)).toBe(false)
        })

        it("supports sorting by price ascending and descending", async () => {
            const asc = await authRequest("/point-submission/schedule?sort=price&order=asc&limit=100", adminToken)
            expect(asc.status).toBe(200)
            const pricesAsc = asc.body.data.map((s: any) => s.price)
            expect(pricesAsc).toEqual([...pricesAsc].sort((a, b) => a - b))

            const desc = await authRequest("/point-submission/schedule?sort=price&order=desc&limit=100", adminToken)
            expect(desc.status).toBe(200)
            const pricesDesc = desc.body.data.map((s: any) => s.price)
            expect(pricesDesc).toEqual([...pricesDesc].sort((a, b) => b - a))
        })

        it("falls back to default sort (createdAt desc) for an unknown sort key", async () => {
            const res = await authRequest("/point-submission/schedule?sort=not-a-real-column", adminToken)
            expect(res.status).toBe(200)
        })

        it("supports sorting by stoppedAt", async () => {
            const res = await authRequest("/point-submission/schedule?sort=stoppedAt&order=DESC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("supports sorting by nisData.branchCode", async () => {
            const res = await authRequest("/point-submission/schedule?sort=branchCode&order=ASC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("supports sorting by nisData.custId", async () => {
            const res = await authRequest("/point-submission/schedule?sort=custId&order=ASC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("supports sorting by nisData.serviceName", async () => {
            const res = await authRequest("/point-submission/schedule?sort=serviceName&order=DESC", adminToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it("adjusts the schedule commission", async () => {
            const res = await authRequest(`/point-submission/schedule/${scheduleId}`, adminToken, { method: "PATCH", body: { price: 250000 } })
            expect(res.status).toBe(200)
            expect(res.body.data.price).toBe(250000)
            expect(res.body.data.point).toBe(250) // floor(250000/1000)
        })

        it("rejects adjusting with an invalid price (422)", async () => {
            const res = await authRequest(`/point-submission/schedule/${scheduleId}`, adminToken, { method: "PATCH", body: { price: -1 } })
            expect(res.status).toBe(422)
        })

        it("adjusts the schedule anchorDay", async () => {
            const res = await authRequest(`/point-submission/schedule/${scheduleId}`, adminToken, { method: "PATCH", body: { anchorDay: 15 } })
            expect(res.status).toBe(200)
            expect(res.body.data.anchorDay).toBe(15)
        })

        it("rejects an out-of-range anchorDay (422)", async () => {
            const tooLow = await authRequest(`/point-submission/schedule/${scheduleId}`, adminToken, { method: "PATCH", body: { anchorDay: 0 } })
            expect(tooLow.status).toBe(422)

            const tooHigh = await authRequest(`/point-submission/schedule/${scheduleId}`, adminToken, { method: "PATCH", body: { anchorDay: 32 } })
            expect(tooHigh.status).toBe(422)
        })

        it("rejects an adjust request with neither price nor anchorDay (422)", async () => {
            const res = await authRequest(`/point-submission/schedule/${scheduleId}`, adminToken, { method: "PATCH", body: {} })
            expect(res.status).toBe(422)
        })

        it("does not record history when the adjustment doesn't actually change anything", async () => {
            const before = await authRequest(`/point-submission/schedule/${scheduleId}/history`, adminToken)
            const countBefore = before.body.data.length

            const current = await authRequest(`/point-submission/schedule/${scheduleId}`, adminToken, { method: "PATCH", body: { price: 250000, anchorDay: 15 } })
            expect(current.status).toBe(200)

            const after = await authRequest(`/point-submission/schedule/${scheduleId}/history`, adminToken)
            expect(after.body.data.length).toBe(countBefore)
        })

        it("records adjustment history and retrieves it via GET .../history", async () => {
            const res = await authRequest(`/point-submission/schedule/${scheduleId}`, adminToken, { method: "PATCH", body: { price: 300000, anchorDay: 20 } })
            expect(res.status).toBe(200)

            const history = await authRequest(`/point-submission/schedule/${scheduleId}/history`, adminToken)
            expect(history.status).toBe(200)
            expect(history.body.success).toBe(true)
            expect(history.body.data.length).toBeGreaterThan(0)

            const latest = history.body.data[0]
            expect(latest.toPrice).toBe(300000)
            expect(latest.toAnchorDay).toBe(20)
            expect(latest.fromPrice).toBe(250000)
            expect(latest.fromAnchorDay).toBe(15)
            expect(latest.changedBy).toEqual({ id: testAdmin.id, name: testAdmin.name })
            expect(latest.createdAt).toBeTruthy()
        })

        it("forbids a non-admin from viewing schedule history (403)", async () => {
            const res = await authRequest(`/point-submission/schedule/${scheduleId}/history`, userToken)
            expect(res.status).toBe(403)
        })

        it("returns 404 when adjusting a non-existent schedule", async () => {
            const res = await authRequest("/point-submission/schedule/999999", adminToken, { method: "PATCH", body: { price: 1000 } })
            expect(res.status).toBe(404)
        })

        it("stops the schedule via PATCH .../stop, then rejects a second stop (400)", async () => {
            const first = await authRequest(`/point-submission/schedule/${scheduleId}/stop`, adminToken, { method: "PATCH" })
            expect(first.status).toBe(200)

            const stopped = await AppDataSource.getRepository(PointSubmissionSchedule).findOneBy({ id: scheduleId! })
            expect(stopped?.isActive).toBe(false)

            const second = await authRequest(`/point-submission/schedule/${scheduleId}/stop`, adminToken, { method: "PATCH" })
            expect(second.status).toBe(400)
        })

        it("filters by stoppedStartDate/stoppedEndDate after the schedule is stopped", async () => {
            const inRange = await authRequest("/point-submission/schedule?stoppedStartDate=2024-01-01&stoppedEndDate=2099-12-31", adminToken)
            expect(inRange.status).toBe(200)
            expect(inRange.body.data.some((s: any) => s.id === scheduleId)).toBe(true)

            const outOfRange = await authRequest("/point-submission/schedule?stoppedStartDate=2099-01-01", adminToken)
            expect(outOfRange.body.data.some((s: any) => s.id === scheduleId)).toBe(false)
        })

        it("returns 404 when stopping a non-existent schedule", async () => {
            const res = await authRequest("/point-submission/schedule/999999/stop", adminToken, { method: "PATCH" })
            expect(res.status).toBe(404)
        })
    })
})
