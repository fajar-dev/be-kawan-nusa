import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { VoucherRedemption } from "./voucher-redemption.entity"

@Entity("voucher_redemption_details")
export class VoucherRedemptionDetail {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "voucher_redemption_id" })
    voucherRedemptionId!: number

    @Column({ name: "code" })
    code!: string
    
    @Column({ name: "expired_date", type: "timestamp", nullable: true })
    expiredDate?: Date
    
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
    
    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date

    @OneToOne(() => VoucherRedemption)
    @JoinColumn({ name: "voucher_redemption_id" })
    voucherRedemption!: Relation<VoucherRedemption>
}
