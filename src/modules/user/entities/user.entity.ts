import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import type { Relation } from "typeorm"
import { Customer } from "../../customer/entities/customer.entity"

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "first_name" })
    firstName!: string

    @Column({ name: "last_name" })
    lastName!: string

    @Column({ nullable: true })
    photo?: string

    @Column({ nullable: true })
    company?: string

    @Column({ name: "job_position", nullable: true })
    jobPosition?: string

    @Column({ unique: true })
    email!: string

    @Column()
    phone!: string

    @Column({ select: false })
    password!: string

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

    @Column({ name: "refresh_token", type: "text", nullable: true })
    refreshToken?: string

    @CreateDateColumn({ name: "password_updated_at" })
    passwordUpdatedAt?: Date

    @OneToMany(() => Customer, (customer) => customer.user)
    customers!: Relation<Customer[]>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
