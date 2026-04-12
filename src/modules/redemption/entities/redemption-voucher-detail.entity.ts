import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { RedemptionVoucher } from "./redemption-voucher.entity"

@Entity("redemption_voucher_details")
export class RedemptionVoucherDetail {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "redemption_voucher_id" })
    redemptionVoucherId!: number

    @Column({ name: "code" })
    code!: string
    
    @Column({ name: "expired_date", type: "timestamp", nullable: true })
    expiredDate?: Date
    
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
    
    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date

    @OneToOne(() => RedemptionVoucher, (redemption) => redemption.detail)
    @JoinColumn({ name: "redemption_voucher_id" })
    redemptionVoucher!: Relation<RedemptionVoucher>
}
