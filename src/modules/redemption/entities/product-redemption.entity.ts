import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { Catalog } from "../../catalog/entities/catalog.entity"

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

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
