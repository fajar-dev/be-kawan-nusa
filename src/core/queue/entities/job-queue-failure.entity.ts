import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm"
import type { Relation } from "typeorm"
import { JobQueue } from "./job-queue.entity"

/**
 * Failure log for job queue entries.
 * Each failed attempt creates a new row so admins can see the full error history.
 */
@Entity("job_queue_failures")
export class JobQueueFailure {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "job_queue_id" })
    jobQueueId!: number

    @Column({ type: "text" })
    error!: string

    @CreateDateColumn({ name: "attempted_at" })
    attemptedAt!: Date

    // Relations
    @ManyToOne(() => JobQueue, { onDelete: "CASCADE" })
    @JoinColumn({ name: "job_queue_id" })
    jobQueue!: Relation<JobQueue>
}
