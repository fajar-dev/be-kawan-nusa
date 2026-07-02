import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from "typeorm"

/**
 * General-purpose job queue.
 *
 * Any module can use this to queue async work. Each entry has:
 * - type: identifies which module/processor handles it (e.g., 'point-submission')
 * - referenceId: FK to the source record in that module
 * - payload: JSON data needed for processing
 * - period: optional date for periodic/recurring jobs (prevents duplicates per period)
 *
 * Unique constraint on (type, referenceId, period) prevents duplicate entries.
 */
@Entity("job_queues")
@Unique("UQ_job_queue_type_ref_period", ["type", "referenceId", "period"])
export class JobQueue {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ type: "varchar", length: 50 })
    type!: string

    @Index()
    @Column({ name: "reference_id" })
    referenceId!: number

    @Column({ name: "payload", type: "json" })
    payload!: Record<string, any>

    @Column({ type: "date", nullable: true })
    period!: Date | null

    @Index()
    @Column({ name: "processed_at", type: "datetime", nullable: true })
    processedAt!: Date | null

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
