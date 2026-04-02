import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "../../user/entities/user.entity"
import { RedemptionType, RedemptionStatus } from "../redemption.enum"
import { WithdrawRedemption } from "./withdraw-redemption.entity"
import { VoucherRedemption } from "./voucher-redemption.entity"
import { ProductRedemption } from "./product-redemption.entity"

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

    @Column({ name: "withdraw_redemp_id", nullable: true })
    withdrawRedemptionId?: number

    @Column({ name: "voucher_redemp_id", nullable: true })
    voucherRedemptionId?: number

    @Column({ name: "product_redemp_id", nullable: true })
    productRedemptionId?: number

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @OneToOne(() => WithdrawRedemption)
    @JoinColumn({ name: "withdraw_redemp_id" })
    withdrawRedemption?: Relation<WithdrawRedemption>

    @OneToOne(() => VoucherRedemption)
    @JoinColumn({ name: "voucher_redemp_id" })
    voucherRedemption?: Relation<VoucherRedemption>

    @OneToOne(() => ProductRedemption)
    @JoinColumn({ name: "product_redemp_id" })
    productRedemption?: Relation<ProductRedemption>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
