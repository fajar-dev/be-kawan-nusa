import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { RateCommission } from "./rate-commission.entity"
import { Employee } from "../../employee/entities/employee.entity"
import { RateCommissionValueType, RateCommissionHistoryAction } from "../rate-commission.enum"

@Entity("rate_commission_histories")
export class RateCommissionHistory {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "rate_commission_id" })
    rateCommissionId!: number

    @Column({ type: "enum", enum: RateCommissionHistoryAction })
    action!: RateCommissionHistoryAction

    /** Null on the "created" row — there is no prior state to show. */
    @Column({ name: "from_value", type: "decimal", precision: 15, scale: 2, nullable: true })
    fromValue?: number | null

    @Column({ name: "to_value", type: "decimal", precision: 15, scale: 2 })
    toValue!: number

    @Column({ name: "from_type", type: "enum", enum: RateCommissionValueType, nullable: true })
    fromType?: RateCommissionValueType | null

    @Column({ name: "to_type", type: "enum", enum: RateCommissionValueType })
    toType!: RateCommissionValueType

    @Column({ name: "from_start_date", type: "date", nullable: true })
    fromStartDate?: Date | null

    @Column({ name: "to_start_date", type: "date" })
    toStartDate!: Date

    @Column({ name: "from_end_date", type: "date", nullable: true })
    fromEndDate?: Date | null

    @Column({ name: "to_end_date", type: "date", nullable: true })
    toEndDate?: Date | null

    /** Note attached to the rate at the time of this revision (not a diff). */
    @Column({ type: "text", nullable: true })
    notes?: string | null

    @Column({ name: "changed_by_id" })
    changedById!: number

    // Relations
    @ManyToOne(() => RateCommission, { onDelete: "CASCADE" })
    @JoinColumn({ name: "rate_commission_id" })
    rateCommission!: Relation<RateCommission>

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "changed_by_id" })
    changedBy!: Relation<Employee>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
