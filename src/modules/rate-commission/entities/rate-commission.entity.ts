import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from "typeorm"
import type { Relation } from "typeorm"
import { Service } from "../../service/entities/service.entity"
import { Employee } from "../../employee/entities/employee.entity"
import { PointType } from "../../point/point.enum"
import { RateCommissionValueType } from "../rate-commission.enum"

/**
 * A service can have at most one rate per category (OTC / Bulanan) —
 * enforced here and re-checked at the service layer for a friendlier error.
 */
@Entity("rate_commissions")
@Unique("UQ_rate_commission_service_category", ["serviceCode", "category"])
export class RateCommission {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "service_code" })
    serviceCode!: string

    @Index()
    @Column({ type: "enum", enum: PointType })
    category!: PointType

    @Column({ type: "decimal", precision: 15, scale: 2 })
    value!: number

    @Column({ type: "enum", enum: RateCommissionValueType })
    type!: RateCommissionValueType

    @Column({ name: "start_date", type: "date" })
    startDate!: Date

    @Column({ name: "end_date", type: "date", nullable: true })
    endDate?: Date | null

    @Column({ type: "text", nullable: true })
    notes?: string | null

    @Column({ name: "created_by_id" })
    createdById!: number

    // Relations
    @ManyToOne(() => Service)
    @JoinColumn({ name: "service_code", referencedColumnName: "code" })
    service!: Relation<Service>

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "created_by_id" })
    createdBy!: Relation<Employee>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
