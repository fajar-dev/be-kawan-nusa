import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { ProductRedemption } from "./product-redemption.entity"
import { Shipper } from "../redemption.enum"

@Entity("product_redemption_shippings")
export class ProductRedemptionShipping {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "product_redemption_id" })
    productRedemptionId!: number
    
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

    @OneToOne(() => ProductRedemption)
    @JoinColumn({ name: "product_redemption_id" })
    productRedemption!: Relation<ProductRedemption>
}
