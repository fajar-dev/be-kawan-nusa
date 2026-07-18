import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "../../user/entities/user.entity"
import { Employee } from "../../employee/entities/employee.entity"
import { PointSubmission } from "./point-submission.entity"

/**
 * Recurring schedule for monthly ("Bulanan") point submissions.
 *
 * Created the first time a Bulanan submission is approved. A daily cron
 * (generate-monthly-submissions) reads active schedules and creates a NEW
 * pending point_submission for each due month — which an admin must approve.
 * There is no end date; a schedule runs until it is deactivated (isActive=false).
 */
@Entity("point_submission_schedules")
export class PointSubmissionSchedule {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "user_id" })
    userId!: number

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

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    price!: number

    /** Day-of-month (1-31) the monthly submission is generated on; clamped per month. */
    @Column({ name: "anchor_day", type: "int" })
    anchorDay!: number

    /** First-of-month of the last period a submission was generated for. */
    @Column({ name: "last_generated_period", type: "date" })
    lastGeneratedPeriod!: Date

    @Index()
    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @Column({ name: "source_submission_id", nullable: true })
    sourceSubmissionId!: number | null

    @Column({ name: "created_by_id" })
    createdById!: number

    @Column({ name: "stopped_by_id", nullable: true })
    stoppedById!: number | null

    @Column({ name: "stopped_at", type: "datetime", nullable: true })
    stoppedAt!: Date | null

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "created_by_id" })
    createdBy!: Relation<Employee>

    @ManyToOne(() => Employee, { nullable: true })
    @JoinColumn({ name: "stopped_by_id" })
    stoppedBy!: Relation<Employee> | null

    @ManyToOne(() => PointSubmission, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "source_submission_id" })
    sourceSubmission!: Relation<PointSubmission> | null

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
