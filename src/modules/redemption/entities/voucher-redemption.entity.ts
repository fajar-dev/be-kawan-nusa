import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { Catalog } from "../../catalog/entities/catalog.entity"
import { VoucherRedemptionDetail } from "./voucher-redemption-detail.entity"

@Entity("voucher_redemptions")
export class VoucherRedemption {
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

    @OneToOne(() => VoucherRedemptionDetail, (detail) => detail.voucherRedemption)
    detail?: Relation<VoucherRedemptionDetail>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
