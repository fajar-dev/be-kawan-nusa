import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { Catalog } from "../../catalog/entities/catalog.entity"
import { RedemptionVoucherDetail } from "./redemption-voucher-detail.entity"

@Entity("redemption_vouchers")
export class RedemptionVoucher {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "catalog_id", nullable: true })
    catalogId?: number

    @ManyToOne(() => Catalog)
    @JoinColumn({ name: "catalog_id" })
    catalog?: Relation<Catalog>

    @Column({ name: "name", nullable: true })
    name?: string

    @Column({ name: "email", nullable: true })
    email?: string

    @OneToOne(() => RedemptionVoucherDetail, (detail) => detail.redemptionVoucher)
    detail?: Relation<RedemptionVoucherDetail>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
