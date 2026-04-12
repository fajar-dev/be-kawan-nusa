import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { RedemptionProduct } from "./redemption-product.entity"
import { Shipper } from "../redemption.enum"

@Entity("redemption_product_shippings")
export class RedemptionProductShipping {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "redemption_product_id" })
    redemptionProductId!: number
    
    @Column({
        type: "enum",
        enum: Shipper,
        nullable: true
    })
    shipper?: Shipper
    
    @Column({ name: "tracking_number", nullable: true })
    trackingNumber?: string
    
    @Column({ name: "shipped_at", type: "timestamp", nullable: true })
    shippedAt?: Date
    
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
    
    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date

    @OneToOne(() => RedemptionProduct, (redemption) => redemption.shipping)
    @JoinColumn({ name: "redemption_product_id" })
    redemptionProduct!: Relation<RedemptionProduct>
}
