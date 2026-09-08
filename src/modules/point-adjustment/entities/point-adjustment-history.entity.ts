import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { PointAdjustment } from "./point-adjustment.entity"
import { Employee } from "../../employee/entities/employee.entity"
import { PointAdjustmentAction } from "../point-adjustment.enum"

@Entity("point_adjustment_histories")
export class PointAdjustmentHistory {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "point_adjustment_id" })
    pointAdjustmentId!: number

    @Column({
        type: "enum",
        enum: PointAdjustmentAction,
    })
    action!: PointAdjustmentAction

    @Column({ type: "text", nullable: true })
    note!: string | null

    @Column({ name: "actor_id" })
    actorId!: number

    // Relations
    @ManyToOne(() => PointAdjustment, { onDelete: "CASCADE" })
    @JoinColumn({ name: "point_adjustment_id" })
    pointAdjustment!: Relation<PointAdjustment>

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "actor_id" })
    actor!: Relation<Employee>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
