import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "../../user/entities/user.entity"
import { Employee } from "../../employee/entities/employee.entity"
import { PointType } from "../../point/point.enum"
import { PointSubmissionStatus } from "../point-submission.enum"

@Entity("point_submissions")
export class PointSubmission {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "user_id" })
    userId!: number

    @Column({
        type: "enum",
        enum: PointType,
        default: PointType.OTC
    })
    type!: PointType

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    point!: number

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    price!: number

    @Column({ name: "nis_data", type: "json" })
    nisData!: {
        custServId: number
        custId: string
        accountName: string
        serviceCode: string
        serviceName: string
        accountManager: string
        salesEmployeeId: string | null
    }

    @Index()
    @Column({
        type: "enum",
        enum: PointSubmissionStatus,
        default: PointSubmissionStatus.PENDING
    })
    status!: PointSubmissionStatus

    @Column({ name: "is_recurring", default: false })
    isRecurring!: boolean

    @Column({ name: "recurring_end_date", type: "date", nullable: true })
    recurringEndDate!: Date | null

    @Column({ type: "text", nullable: true })
    notes!: string | null

    @Index()
    @Column({ name: "created_by_id" })
    createdById!: number

    @Column({ name: "approved_by_id", nullable: true })
    approvedById!: number | null

    @Column({ name: "approved_at", type: "datetime", nullable: true })
    approvedAt!: Date | null

    @Column({ name: "processed_at", type: "datetime", nullable: true })
    processedAt!: Date | null

    @Column({ name: "retry_count", type: "int", default: 0 })
    retryCount!: number

    @Column({ name: "last_error", type: "text", nullable: true })
    lastError!: string | null

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "created_by_id" })
    createdBy!: Relation<Employee>

    @ManyToOne(() => Employee, { nullable: true })
    @JoinColumn({ name: "approved_by_id" })
    approvedBy!: Relation<Employee> | null

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
