import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert } from "typeorm"
import type { Relation } from "typeorm"
import { CustomerService } from "../../customer-service/entities/customer-service.entity"
import { PointSubmission } from "../../point-submission/entities/point-submission.entity"
import { PointType } from "../point.enum"

@Entity("points")
export class Point {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "customer_service_id" })
    customerServiceId!: number

    @Column({ name: "point_submission_id", nullable: true })
    pointSubmissionId!: number | null

    @Column({ type: "decimal", precision: 15, scale: 2 })
    price!: number

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    point!: number

    @Column({ name: "expired_date", type: "date" })
    expiredDate!: Date

    @Column({ name: "remaining_point", type: "decimal", precision: 15, scale: 2, default: 0 })
    remainingPoint!: number

    @Index()
    @Column({
        type: "enum",
        enum: PointType,
        default: PointType.OTC
    })
    type!: PointType

    // Relations
    @ManyToOne(() => CustomerService, (customerService) => customerService.rewards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "customer_service_id" })
    customerService!: Relation<CustomerService>

    @ManyToOne(() => PointSubmission, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: "point_submission_id" })
    pointSubmission!: Relation<PointSubmission> | null

    @Index()
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date

    @BeforeInsert()
    setInitialValues() {
        if (!this.expiredDate) {
            const date = new Date()
            date.setFullYear(date.getFullYear() + 1)
            this.expiredDate = date
        }

        if (!this.remainingPoint) {
            this.remainingPoint = this.point
        }
    }
}
