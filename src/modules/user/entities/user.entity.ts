import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import type { Relation } from "typeorm"
import { CustomerService } from "../../customer-service/entities/customer-service.entity"
import { Redemption } from "../../redemption/entities/redemption.entity"

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "first_name"})
    firstName!: string

    @Column({ name: "last_name", nullable: true })
    lastName?: string

    @Column({ nullable: true })
    photo?: string

    @Column({ nullable: true })
    company?: string

    @Column({ name: "job_position", nullable: true })
    jobPosition?: string

    @Column({ unique: true, nullable: true })
    email?: string

    @Column({ unique: true, nullable: true })
    phone?: string

    @Column({ name: "identity_number", type: "bigint", nullable: true })
    identityNumber?: number

    @Column({ name: "tax_number", nullable: true })
    taxNumber?: string

    @Column({ select: false, nullable: true })
    password?: string

    @Column({ name: "account_holder_name", nullable: true })
    accountHolderName?: string

    @Column({ name: "bank_name", nullable: true })
    bankName?: string

    @Column({ name: "account_number", nullable: true })
    accountNumber?: string

    @Column({ name: "is_subscribe", default: false })
    isSubscribe!: boolean

    @Column({ name: "is_auto_withdraw", default: false })
    isAutoWithdraw!: boolean

    @Column({ name: "reset_password_token", nullable: true })
    resetPasswordToken?: string

    @Column({ name: "reset_password_expires", type: "timestamp", nullable: true })
    resetPasswordExpires?: Date

    @Column({ name: "password_updated_at", type: "timestamp", nullable: true })
    passwordUpdatedAt?: Date

    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @OneToMany(() => CustomerService, (customerService) => customerService.user)
    customerServices!: Relation<CustomerService[]>

    @OneToMany(() => Redemption, (redemption) => redemption.user)
    redemptions!: Relation<Redemption[]>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
