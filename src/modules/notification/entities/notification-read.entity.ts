import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from "typeorm"
import type { Relation } from "typeorm"
import { Notification } from "./notification.entity"
import { User } from "../../user/entities/user.entity"

/**
 * Per-user read marker. A row here means `userId` has read `notificationId`.
 * Works for both targeted and broadcast notifications.
 */
@Entity("notification_reads")
@Unique("UQ_notification_read_user", ["notificationId", "userId"])
export class NotificationRead {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "notification_id" })
    notificationId!: number

    @Index()
    @Column({ name: "user_id" })
    userId!: number

    @ManyToOne(() => Notification, { onDelete: "CASCADE" })
    @JoinColumn({ name: "notification_id" })
    notification!: Relation<Notification>

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @CreateDateColumn({ name: "read_at" })
    readAt!: Date
}
