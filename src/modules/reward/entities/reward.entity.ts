import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { CustomerService } from "../../customer-service/entities/customer-service.entity"
import { RewardPointType } from "../reward.enum"

@Entity("rewards")
export class Reward {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "customer_service_id" })
    customerServiceId!: number

    @Column({ type: "decimal", precision: 15, scale: 2 })
    price!: number

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    point!: number

    @Column({ name: "payment_date", type: "date"})
    paymentDate!: Date

    @Index()
    @Column({
        type: "enum",
        enum: RewardPointType,
        default: RewardPointType.OTP
    })
    type!: RewardPointType

    // Relations
    @ManyToOne(() => CustomerService, (customerService) => customerService.rewards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "customer_service_id" })
    customerService!: Relation<CustomerService>

    @Index()
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
