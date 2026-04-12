import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("redemption_withdraws")
export class RedemptionWithdraw {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "bank_name" })
    bankName!: string

    @Column({ name: "account_number" })
    accountNumber!: string

    @Column({ name: "account_holder_name" })
    accountHolderName!: string

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    payout!: number

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    tax!: number

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
