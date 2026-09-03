import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { Employee } from "../../employee/entities/employee.entity"
import { ReportType, ReportFormat } from "../report.enum"

@Entity("report_download_histories")
export class ReportDownloadHistory {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({
        type: "enum",
        enum: ReportType,
    })
    type!: ReportType

    @Column({
        type: "enum",
        enum: ReportFormat,
    })
    format!: ReportFormat

    @Column({ name: "period_label" })
    periodLabel!: string

    @Column({ type: "json", nullable: true })
    filters!: Record<string, unknown> | null

    @Index()
    @Column({ name: "requested_by_id" })
    requestedById!: number

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "requested_by_id" })
    requestedBy!: Relation<Employee>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
