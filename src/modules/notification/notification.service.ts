import { Notification } from "./entities/notification.entity"
import { NotificationType } from "./notification.enum"
import { INotificationRepository } from "./interfaces/notification.repository.interface"
import { NotFoundException } from "../../core/exceptions/base"
import { logger } from "../../core/helpers/logger"

export interface CreateNotificationInput {
    type: NotificationType
    title: string
    message: string
    link?: string | null
    referenceId?: number | null
}

export class NotificationService {
    constructor(private readonly repository: INotificationRepository) {}

    async getForUser(userId: number, page: number, limit: number): Promise<{ data: Notification[]; readIds: Set<number>; total: number }> {
        const { data, total } = await this.repository.findForUser(userId, page, limit)
        const readIds = await this.repository.findReadIds(userId, data.map(n => n.id))
        return { data, readIds, total }
    }

    async getUnreadCount(userId: number): Promise<number> {
        return this.repository.countUnread(userId)
    }

    async markRead(userId: number, notificationId: number): Promise<void> {
        const notification = await this.repository.findById(notificationId)
        // Hide notifications the user can't see (targeted at someone else).
        if (!notification || (notification.userId !== null && notification.userId !== userId)) {
            throw new NotFoundException("Notification not found")
        }
        await this.repository.markRead(userId, notificationId)
    }

    async markAllRead(userId: number): Promise<number> {
        return this.repository.markAllRead(userId)
    }

    /** Create a targeted notification for one user. Safe to call fire-and-forget. */
    async notifyUser(userId: number, input: CreateNotificationInput): Promise<Notification> {
        return this.repository.create({ userId, ...input, link: input.link ?? null, referenceId: input.referenceId ?? null })
    }

    /** Create a broadcast notification visible to all users. */
    async notifyBroadcast(input: CreateNotificationInput): Promise<Notification> {
        return this.repository.create({ userId: null, ...input, link: input.link ?? null, referenceId: input.referenceId ?? null })
    }

    /**
     * Convenience wrapper: create a notification without letting a failure break the
     * caller's main flow (logs and swallows). Use from event sites (jobs/services).
     */
    async safeNotifyUser(userId: number, input: CreateNotificationInput): Promise<void> {
        try {
            await this.notifyUser(userId, input)
        } catch (error: any) {
            logger.error("Failed to create user notification", { event: "notification.failed", userId, error: error?.message })
        }
    }

    async safeNotifyBroadcast(input: CreateNotificationInput): Promise<void> {
        try {
            await this.notifyBroadcast(input)
        } catch (error: any) {
            logger.error("Failed to create broadcast notification", { event: "notification.failed", error: error?.message })
        }
    }
}
