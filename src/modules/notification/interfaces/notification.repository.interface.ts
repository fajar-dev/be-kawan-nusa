import { Notification } from "../entities/notification.entity"

export interface INotificationRepository {
    /** Paginated notifications visible to a user (their own + broadcasts), newest first. */
    findForUser(userId: number, page: number, limit: number): Promise<{ data: Notification[]; total: number }>

    /** Which of the given notification ids the user has already read. */
    findReadIds(userId: number, notificationIds: number[]): Promise<Set<number>>

    /** Count of unread notifications visible to the user. */
    countUnread(userId: number): Promise<number>

    findById(id: number): Promise<Notification | null>

    /** Mark a single notification read for a user (idempotent). */
    markRead(userId: number, notificationId: number): Promise<void>

    /** Mark every currently-unread notification read for a user. */
    markAllRead(userId: number): Promise<number>

    create(data: Partial<Notification>): Promise<Notification>
}
