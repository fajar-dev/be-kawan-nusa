import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import type { Relation } from "typeorm"
import { CustomerService } from "../../customer-service/entities/customer-service.entity"
import { Redemption } from "../../redemption/entities/redemption.entity"
import { PasswordResetToken } from "../../auth/entities/password-reset-token.entity"
import { EmailVerificationToken } from "../../auth/entities/email-verification-token.entity"

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

    @Column({ name: "birth_date", type: "date", nullable: true })
    birthDate?: string

    @Column({ name: "birth_place", nullable: true })
    birthPlace?: string

    @Column({ type: "text", nullable: true })
    address?: string

    @Column({ name: "company_address", type: "text", nullable: true })
    companyAddress?: string

    @Column({ name: "identity_path", nullable: true })
    identityPath?: string

    @Column({ name: "account_path", nullable: true })
    accountPath?: string

    @Column({ unique: true, nullable: true })
    email?: string

    @Column({ unique: true, nullable: true })
    phone?: string

    @Column({ name: "has_whatsapp", default: false })
    hasWhatsapp!: boolean

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

    @Column({ name: "password_updated_at", type: "timestamp", nullable: true })
    passwordUpdatedAt?: Date

    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @Column({ name: "last_login_at", type: "timestamp", nullable: true })
    lastLoginAt?: Date

    @Column({ name: "is_verified", default: false })
    isVerified!: boolean

    @OneToMany(() => CustomerService, (customerService) => customerService.user)
    customerServices!: Relation<CustomerService[]>

    @OneToMany(() => Redemption, (redemption) => redemption.user)
    redemptions!: Relation<Redemption[]>

    @OneToMany(() => PasswordResetToken, (token) => token.user)
    passwordResetTokens!: Relation<PasswordResetToken[]>

    @OneToMany(() => EmailVerificationToken, (token) => token.user)
    emailVerificationTokens!: Relation<EmailVerificationToken[]>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
