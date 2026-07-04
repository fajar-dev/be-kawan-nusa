import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { Redemption } from "./redemption.entity"
import { Employee } from "../../employee/entities/employee.entity"
import { RedemptionStatus } from "../redemption.enum"

@Entity("redemption_status_histories")
export class RedemptionStatusHistory {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "redemption_id" })
    redemptionId!: number

    @Column({ name: "from_status", type: "enum", enum: RedemptionStatus, nullable: true })
    fromStatus!: RedemptionStatus | null

    @Column({ name: "to_status", type: "enum", enum: RedemptionStatus })
    toStatus!: RedemptionStatus

    @Column({ type: "text", nullable: true })
    note!: string | null

    @Column({ name: "changed_by_id" })
    changedById!: number

    // Relations
    @ManyToOne(() => Redemption)
    @JoinColumn({ name: "redemption_id" })
    redemption!: Relation<Redemption>

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "changed_by_id" })
    changedBy!: Relation<Employee>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
