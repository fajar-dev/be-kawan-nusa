import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { PointSubmission } from "../../point-submission/entities/point-submission.entity"
import { Employee } from "../../employee/entities/employee.entity"
import { PointAdjustmentStatus } from "../point-adjustment.enum"

/**
 * A correction request for a still-pending PointSubmission's commission value,
 * routed for approval to the requester's own manager (Employee.managerId) rather
 * than a fixed role. While a request is open (pending_approval / needs_revision)
 * the underlying PointSubmission is excluded from the normal admin approve queue.
 */
@Entity("point_adjustments")
export class PointAdjustment {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true })
    code!: string

    @Index()
    @Column({ name: "point_submission_id" })
    pointSubmissionId!: number

    @Index()
    @Column({ name: "requested_by_id" })
    requestedById!: number

    @Index()
    @Column({ name: "approver_id" })
    approverId!: number

    @Column({ name: "from_value", type: "decimal", precision: 15, scale: 2 })
    fromValue!: number

    @Column({ name: "to_value", type: "decimal", precision: 15, scale: 2 })
    toValue!: number

    @Column({ name: "from_point", type: "decimal", precision: 15, scale: 2 })
    fromPoint!: number

    @Column({ name: "to_point", type: "decimal", precision: 15, scale: 2 })
    toPoint!: number

    @Column({ type: "text" })
    reason!: string

    @Column({ name: "review_note", type: "text", nullable: true })
    reviewNote!: string | null

    @Index()
    @Column({
        type: "enum",
        enum: PointAdjustmentStatus,
        default: PointAdjustmentStatus.PENDING_APPROVAL,
    })
    status!: PointAdjustmentStatus

    // Relations
    @ManyToOne(() => PointSubmission, { onDelete: "CASCADE" })
    @JoinColumn({ name: "point_submission_id" })
    pointSubmission!: Relation<PointSubmission>

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "requested_by_id" })
    requestedBy!: Relation<Employee>

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "approver_id" })
    approver!: Relation<Employee>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
