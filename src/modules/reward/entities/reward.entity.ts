import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert } from "typeorm"
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


    @Column({ name: "expired_date", type: "date" })
    expiredDate!: Date

    @Column({ name: "remaining_point", type: "decimal", precision: 15, scale: 2, default: 0 })
    remainingPoint!: number

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
