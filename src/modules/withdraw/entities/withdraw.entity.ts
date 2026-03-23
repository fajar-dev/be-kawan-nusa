import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "../../user/entities/user.entity"

@Entity("withdrawals")
export class Withdraw {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "user_id" })
    userId!: number

    @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
    point!: number

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

    @ManyToOne(() => User, (user) => user.withdrawals)
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
