import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "../../user/entities/user.entity"
import { RedemptionType, RedemptionStatus } from "../redemption.enum"
import { RedemptionWithdraw } from "./redemption-withdraw.entity"
import { RedemptionVoucher } from "./redemption-voucher.entity"
import { RedemptionProduct } from "./redemption-product.entity"

@Entity("redemptions")
export class Redemption {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "redemp_no", unique: true, length: 50 })
    redempNo!: string

    @Index()
    @Column({ name: "user_id" })
    userId!: number

    @Column({ name: "points_used", type: "int" })
    pointsUsed!: number

    @Column({
        type: "enum",
        enum: RedemptionType
    })
    type!: RedemptionType

    @Column({
        type: "enum",
        enum: RedemptionStatus,
        default: RedemptionStatus.PENDING
    })
    status!: RedemptionStatus

    @Column({ type: "text", nullable: true })
    notes?: string

    @Column({ name: "redemption_withdraw_id", nullable: true })
    redemptionWithdrawId?: number

    @Column({ name: "redemption_voucher_id", nullable: true })
    redemptionVoucherId?: number

    @Column({ name: "redemption_product_id", nullable: true })
    redemptionProductId?: number

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @OneToOne(() => RedemptionWithdraw)
    @JoinColumn({ name: "redemption_withdraw_id" })
    redemptionWithdraw?: Relation<RedemptionWithdraw>

    @OneToOne(() => RedemptionVoucher)
    @JoinColumn({ name: "redemption_voucher_id" })
    redemptionVoucher?: Relation<RedemptionVoucher>

    @OneToOne(() => RedemptionProduct)
    @JoinColumn({ name: "redemption_product_id" })
    redemptionProduct?: Relation<RedemptionProduct>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
