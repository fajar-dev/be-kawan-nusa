import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { AppDataSource } from "../../src/config/database"
import { PointSubmission } from "../../src/modules/point-submission/entities/point-submission.entity"
import { PointAdjustment } from "../../src/modules/point-adjustment/entities/point-adjustment.entity"
import { PointAdjustmentHistory } from "../../src/modules/point-adjustment/entities/point-adjustment-history.entity"
import { pointAdjustmentService } from "../../src/modules/point-adjustment/point-adjustment.module"

describe("Point Adjustment Module", () => {
    let testUser: User
    let approver: Employee
    let requester: Employee
    let outsider: Employee
    let approverToken: string
    let requesterToken: string
    let outsiderToken: string

    const makeNisData = () => ({
        custServId: 700000 + Math.floor(Math.random() * 90000),
        custId: `CUST-PA-${Date.now()}`,
        accountName: "PA Test Account",
        serviceCode: "SVC-PA",
        serviceName: "PA Test Service",
        accountManager: "PA AM",
        salesEmployeeId: null,
    })

    const createPendingSubmission = async (createdById: number) => {
        return await AppDataSource.getRepository(PointSubmission).save({
            userId: testUser.id,
            createdById,
            type: "OTC" as any,
            price: 100000,
            point: 100,
            status: "pending" as any,
            nisData: makeNisData(),
        })
    }

    const cleanupSubmission = async (id?: number | null) => {
        if (!id) return
        const adjustments = await AppDataSource.getRepository(PointAdjustment).find({ where: { pointSubmissionId: id } })
        for (const adj of adjustments) {
            await AppDataSource.getRepository(PointAdjustmentHistory).delete({ pointAdjustmentId: adj.id })
        }
        await AppDataSource.getRepository(PointAdjustment).delete({ pointSubmissionId: id })
        await AppDataSource.getRepository(PointSubmission).delete(id)
    }

    beforeAll(async () => {
        testUser = await createTestUser()
        approver = await createTestAdmin({ name: "Approver Manager" })
        requester = await createTestAdmin({ name: "Requester AM", managerId: approver.id })
        outsider = await createTestAdmin({ name: "Outsider Admin" })
        approverToken = await generateAdminToken(approver)
        requesterToken = await generateAdminToken(requester)
        outsiderToken = await generateAdminToken(outsider)
    })

    afterAll(async () => {
        if (testUser?.id) await cleanupTestUser(testUser.id)
        if (approver?.id) await cleanupTestAdmin(approver.id)
        if (requester?.id) await cleanupTestAdmin(requester.id)
        if (outsider?.id) await cleanupTestAdmin(outsider.id)
    })

    describe("POST /point-adjustment", () => {
        let submissionId: number

        beforeAll(async () => {
            const submission = await createPendingSubmission(requester.id)
            submissionId = submission.id
        })

        afterAll(async () => {
            await cleanupSubmission(submissionId)
        })

        it("rejects a requester with no manager configured", async () => {
            const orphanSubmission = await createPendingSubmission(outsider.id)
            const res = await authRequest("/point-adjustment", outsiderToken, {
                method: "POST",
                body: { pointSubmissionId: orphanSubmission.id, toValue: 90000, reason: "test" },
            })
            expect(res.status).toBe(400)
            await cleanupSubmission(orphanSubmission.id)
        })

        it("rejects adjusting a submission that isn't yours", async () => {
            const otherSubmission = await createPendingSubmission(approver.id)
            const res = await authRequest("/point-adjustment", requesterToken, {
                method: "POST",
                body: { pointSubmissionId: otherSubmission.id, toValue: 50000, reason: "not mine" },
            })
            expect(res.status).toBe(403)
            await cleanupSubmission(otherSubmission.id)
        })

        it("creates a pending_approval adjustment routed to the requester's manager", async () => {
            const res = await authRequest("/point-adjustment", requesterToken, {
                method: "POST",
                body: { pointSubmissionId: submissionId, toValue: 80000, reason: "Koreksi nilai kontrak" },
            })
            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("pending_approval")
            expect(res.body.data.code).toMatch(/^PSN-\d{4}-\d{4}$/)
            expect(res.body.data.fromValue).toBe(100000)
            expect(res.body.data.toValue).toBe(80000)
            expect(res.body.data.toPoint).toBe(80)
            expect(res.body.data.approver.id).toBe(approver.id)
            expect(res.body.data.requestedBy.id).toBe(requester.id)
        })

        it("rejects a second open adjustment for the same submission", async () => {
            const res = await authRequest("/point-adjustment", requesterToken, {
                method: "POST",
                body: { pointSubmissionId: submissionId, toValue: 70000, reason: "duplicate attempt" },
            })
            expect(res.status).toBe(400)
        })

        it("excludes the locked submission from the pending Input Poin queue", async () => {
            const res = await authRequest("/point-submission?status=pending&limit=100", requesterToken)
            expect(res.status).toBe(200)
            expect(res.body.data.some((s: any) => s.id === submissionId)).toBe(false)
        })

        it("blocks editing the locked submission directly", async () => {
            const res = await authRequest(`/point-submission/${submissionId}`, requesterToken, {
                method: "PUT",
                body: { price: 60000 },
            })
            expect(res.status).toBe(400)
        })

        it("blocks approving the locked submission directly", async () => {
            const res = await authRequest("/point-submission/approve", requesterToken, {
                method: "POST",
                body: { ids: [submissionId] },
            })
            expect(res.status).toBe(400)
        })
    })

    describe("Review flow (approve / reject / resubmit)", () => {
        let submissionId: number
        let adjustmentId: number

        beforeAll(async () => {
            const submission = await createPendingSubmission(requester.id)
            submissionId = submission.id

            const createRes = await authRequest("/point-adjustment", requesterToken, {
                method: "POST",
                body: { pointSubmissionId: submissionId, toValue: 85000, reason: "Diskon loyalitas" },
            })
            adjustmentId = createRes.body.data.id
        })

        afterAll(async () => {
            await cleanupSubmission(submissionId)
        })

        it("rejects review from someone who isn't the assigned approver", async () => {
            const res = await authRequest(`/point-adjustment/${adjustmentId}/review`, requesterToken, {
                method: "PATCH",
                body: { action: "approve" },
            })
            expect(res.status).toBe(403)
        })

        it("requires a note when returning for revision", async () => {
            const res = await authRequest(`/point-adjustment/${adjustmentId}/review`, approverToken, {
                method: "PATCH",
                body: { action: "reject" },
            })
            expect(res.status).toBe(400)
        })

        it("returns the request for revision with a note", async () => {
            const res = await authRequest(`/point-adjustment/${adjustmentId}/review`, approverToken, {
                method: "PATCH",
                body: { action: "reject", note: "Lampirkan bukti pembayaran final" },
            })
            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("needs_revision")
            expect(res.body.data.reviewNote).toBe("Lampirkan bukti pembayaran final")
        })

        it("stays excluded from the pending queue while needing revision", async () => {
            const res = await authRequest("/point-submission?status=pending&limit=100", requesterToken)
            expect(res.body.data.some((s: any) => s.id === submissionId)).toBe(false)
        })

        it("only the original requester can resubmit", async () => {
            const res = await authRequest(`/point-adjustment/${adjustmentId}/resubmit`, approverToken, {
                method: "PATCH",
                body: { toValue: 88000, reason: "revised" },
            })
            expect(res.status).toBe(403)
        })

        it("resubmits with an updated value, going back to pending_approval", async () => {
            const res = await authRequest(`/point-adjustment/${adjustmentId}/resubmit`, requesterToken, {
                method: "PATCH",
                body: { toValue: 88000, reason: "Pembayaran final terkonfirmasi Rp88.000" },
            })
            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("pending_approval")
            expect(res.body.data.toValue).toBe(88000)
            expect(res.body.data.toPoint).toBe(88)
        })

        it("approves the request, syncing the new value onto the submission and unlocking it", async () => {
            const res = await authRequest(`/point-adjustment/${adjustmentId}/review`, approverToken, {
                method: "PATCH",
                body: { action: "approve" },
            })
            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("approved_pending_credit")

            const submission = await AppDataSource.getRepository(PointSubmission).findOneBy({ id: submissionId })
            expect(Number(submission?.price)).toBe(88000)
            expect(Number(submission?.point)).toBe(88)

            const listRes = await authRequest("/point-submission?status=pending&limit=100", requesterToken)
            expect(listRes.body.data.some((s: any) => s.id === submissionId)).toBe(true)
        })

        it("records the full audit trail", async () => {
            const res = await authRequest(`/point-adjustment/${adjustmentId}`, requesterToken)
            expect(res.status).toBe(200)
            const actions = res.body.data.histories.map((h: any) => h.action)
            expect(actions).toEqual(["submitted", "returned_for_revision", "resubmitted", "approved"])
        })

        it("marks the adjustment completed once the linked submission is credited", async () => {
            await pointAdjustmentService.markCreditedIfLinked(submissionId, approver.id)

            const res = await authRequest(`/point-adjustment/${adjustmentId}`, requesterToken)
            expect(res.body.data.status).toBe("completed")
            expect(res.body.data.histories.at(-1).action).toBe("credited")
        })
    })

    describe("GET /point-adjustment (list & counts)", () => {
        let submissionId: number
        let adjustmentId: number

        beforeAll(async () => {
            const submission = await createPendingSubmission(requester.id)
            submissionId = submission.id
            const createRes = await authRequest("/point-adjustment", requesterToken, {
                method: "POST",
                body: { pointSubmissionId: submissionId, toValue: 40000, reason: "list test" },
            })
            adjustmentId = createRes.body.data.id
        })

        afterAll(async () => {
            await cleanupSubmission(submissionId)
        })

        it("lists adjustments visible to the requester", async () => {
            const res = await authRequest("/point-adjustment?tab=menunggu_sm", requesterToken)
            expect(res.status).toBe(200)
            expect(res.body.data.some((a: any) => a.id === adjustmentId)).toBe(true)
        })

        it("lists the same adjustment for the assigned approver", async () => {
            const res = await authRequest("/point-adjustment?tab=menunggu_sm", approverToken)
            expect(res.body.data.some((a: any) => a.id === adjustmentId)).toBe(true)
        })

        it("does not leak the adjustment to an uninvolved admin", async () => {
            const res = await authRequest("/point-adjustment?tab=menunggu_sm", outsiderToken)
            expect(res.body.data.some((a: any) => a.id === adjustmentId)).toBe(false)
        })

        it("returns per-tab counts for the requester", async () => {
            const res = await authRequest("/point-adjustment/counts", requesterToken)
            expect(res.status).toBe(200)
            expect(res.body.data.menunggu_sm).toBeGreaterThanOrEqual(1)
        })

        it("blocks fetching a single adjustment you're not involved in", async () => {
            const res = await authRequest(`/point-adjustment/${adjustmentId}`, outsiderToken)
            expect(res.status).toBe(403)
        })
    })

    describe("GET /point-adjustment/eligible-submissions", () => {
        let submissionId: number

        beforeAll(async () => {
            const submission = await createPendingSubmission(requester.id)
            submissionId = submission.id
        })

        afterAll(async () => {
            await cleanupSubmission(submissionId)
        })

        it("lists the requester's own pending submissions without an open adjustment", async () => {
            const res = await authRequest("/point-adjustment/eligible-submissions", requesterToken)
            expect(res.status).toBe(200)
            expect(res.body.data.some((s: any) => s.id === submissionId)).toBe(true)
        })

        it("does not list another employee's submissions", async () => {
            const res = await authRequest("/point-adjustment/eligible-submissions", outsiderToken)
            expect(res.body.data.some((s: any) => s.id === submissionId)).toBe(false)
        })

        it("drops a submission from the list once it has an open adjustment", async () => {
            await authRequest("/point-adjustment", requesterToken, {
                method: "POST",
                body: { pointSubmissionId: submissionId, toValue: 30000, reason: "lock check" },
            })
            const res = await authRequest("/point-adjustment/eligible-submissions", requesterToken)
            expect(res.body.data.some((s: any) => s.id === submissionId)).toBe(false)
        })
    })

    describe("Permission checks", () => {
        it("rejects unauthenticated access", async () => {
            const res = await authRequest("/point-adjustment", "invalid-token")
            expect(res.status).toBe(401)
        })
    })
})
