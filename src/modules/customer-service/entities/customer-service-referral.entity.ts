import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, Index } from "typeorm"
import type { Relation } from "typeorm"
import { CustomerService } from "./customer-service.entity"
import { User } from "../../user/entities/user.entity"

@Entity("customer_service_referrals")
@Unique(["customerServiceId", "userId"])
export class CustomerServiceReferral {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "customer_service_id" })
    customerServiceId!: number

    @Index()
    @Column({ name: "user_id" })
    userId!: number

    // Relations
    @ManyToOne(() => CustomerService, (cs) => cs.referrals, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "customer_service_id" })
    customerService!: Relation<CustomerService>

    @ManyToOne(() => User, (user) => user.referrals, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
