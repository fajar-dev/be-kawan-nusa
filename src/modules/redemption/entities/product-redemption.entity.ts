import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { Catalog } from "../../catalog/entities/catalog.entity"
import { ProductRedemptionShipping } from "./product-redemption-shipping.entity"

@Entity("product_redemptions")
export class ProductRedemption {
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

    @Column({ name: "phone", nullable: true })
    phone?: string

    @Column({ name: "address", type: "text", nullable: true })
    address?: string

    @OneToOne(() => ProductRedemptionShipping, (shipping) => shipping.productRedemption)
    shipping?: Relation<ProductRedemptionShipping>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
