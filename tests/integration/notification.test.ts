import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { authRequest, request } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { AppDataSource } from "../../src/config/database"
import { Notification } from "../../src/modules/notification/entities/notification.entity"
import { NotificationRead } from "../../src/modules/notification/entities/notification-read.entity"
import { notificationService } from "../../src/modules/notification/notification.module"
import { NotificationType } from "../../src/modules/notification/notification.enum"

describe("Notification Module (user only)", () => {
    let testUser: User
    let testAdmin: Employee
    let userToken: string
    let adminToken: string
    let ownNotifId: number
    let broadcastNotifId: number

    beforeAll(async () => {
        testUser = await createTestUser()
        testAdmin = await createTestAdmin()
        userToken = await generateUserToken(testUser)
        adminToken = await generateAdminToken(testAdmin)

        const own = await notificationService.notifyUser(testUser.id, { type: NotificationType.POINT, title: "Poin Baru", message: "test", link: "/point/activity/reward" })
        const broadcast = await notificationService.notifyBroadcast({ type: NotificationType.CONTENT, title: "Broadcast", message: "semua" })
        ownNotifId = own.id
        broadcastNotifId = broadcast.id
    })

    afterAll(async () => {
        await AppDataSource.getRepository(NotificationRead).delete({ userId: testUser.id })
        await AppDataSource.getRepository(Notification).delete({ userId: testUser.id })
        await AppDataSource.getRepository(Notification).delete({ id: broadcastNotifId })
        if (testUser?.id) await cleanupTestUser(testUser.id)
        if (testAdmin?.id) await cleanupTestAdmin(testAdmin.id)
    })

    describe("GET /notification", () => {
        it("returns own + broadcast notifications for a user", async () => {
            const res = await authRequest("/notification", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            const ids = res.body.data.map((n: any) => n.id)
            expect(ids).toContain(ownNotifId)
            expect(ids).toContain(broadcastNotifId)
            const broadcast = res.body.data.find((n: any) => n.id === broadcastNotifId)
            expect(broadcast.isBroadcast).toBe(true)
            expect(broadcast.isRead).toBe(false)
        })

        it("forbids admin (403)", async () => {
            const res = await authRequest("/notification", adminToken)
            expect(res.status).toBe(403)
        })

        it("fails without auth (401)", async () => {
            const res = await request("/notification")
            expect(res.status).toBe(401)
        })
    })

    describe("GET /notification/unread-count", () => {
        it("returns the unread count for the user", async () => {
            const res = await authRequest("/notification/unread-count", userToken)
            expect(res.status).toBe(200)
            expect(res.body.data.count).toBeGreaterThanOrEqual(2)
        })
    })

    describe("PATCH /notification/:id/read", () => {
        it("marks a notification read", async () => {
            const res = await authRequest(`/notification/${ownNotifId}/read`, userToken, { method: "PATCH" })
            expect(res.status).toBe(200)

            const list = await authRequest("/notification", userToken)
            const own = list.body.data.find((n: any) => n.id === ownNotifId)
            expect(own.isRead).toBe(true)
        })

        it("returns 404 for a non-existent notification", async () => {
            const res = await authRequest("/notification/999999/read", userToken, { method: "PATCH" })
            expect(res.status).toBe(404)
        })
    })

    describe("PATCH /notification/read-all", () => {
        it("marks all remaining notifications read", async () => {
            const res = await authRequest("/notification/read-all", userToken, { method: "PATCH" })
            expect(res.status).toBe(200)

            const count = await authRequest("/notification/unread-count", userToken)
            expect(count.body.data.count).toBe(0)
        })
    })
})
