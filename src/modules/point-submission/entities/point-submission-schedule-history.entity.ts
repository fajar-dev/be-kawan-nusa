import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { PointSubmissionSchedule } from "./point-submission-schedule.entity"
import { Employee } from "../../employee/entities/employee.entity"

@Entity("point_submission_schedule_histories")
export class PointSubmissionScheduleHistory {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "schedule_id" })
    scheduleId!: number

    @Column({ name: "from_price", type: "decimal", precision: 15, scale: 2 })
    fromPrice!: number

    @Column({ name: "to_price", type: "decimal", precision: 15, scale: 2 })
    toPrice!: number

    @Column({ name: "from_anchor_day", type: "int" })
    fromAnchorDay!: number

    @Column({ name: "to_anchor_day", type: "int" })
    toAnchorDay!: number

    @Column({ name: "changed_by_id" })
    changedById!: number

    // Relations
    @ManyToOne(() => PointSubmissionSchedule, { onDelete: "CASCADE" })
    @JoinColumn({ name: "schedule_id" })
    schedule!: Relation<PointSubmissionSchedule>

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "changed_by_id" })
    changedBy!: Relation<Employee>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
