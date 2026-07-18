import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "../../user/entities/user.entity"
import { NotificationType } from "../notification.enum"

/**
 * A notification for referral partners (role `user`).
 *
 * userId = null  → broadcast (visible to ALL users)
 * userId = set   → targeted at a single user
 *
 * Read state is tracked per-user in `notification_reads` (so broadcasts have an
 * independent read state for each user).
 */
@Entity("notifications")
export class Notification {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "user_id", nullable: true })
    userId!: number | null

    @Column({ type: "enum", enum: NotificationType, default: NotificationType.GENERAL })
    type!: NotificationType

    @Column()
    title!: string

    @Column({ type: "text" })
    message!: string

    /** Optional in-app route the notification links to (clickable). */
    @Column({ type: "varchar", nullable: true })
    link!: string | null

    /** Optional id of the source record (redemption id, point id, …). */
    @Column({ name: "reference_id", nullable: true })
    referenceId!: number | null

    @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User> | null

    @Index()
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
