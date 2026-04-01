import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { CatalogCategory } from "../../catalog-category/entities/catalog-category.entity"

@Entity("catalogs")
export class Catalog {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "category_id" })
    categoryId!: number

    @Column()
    name!: string

    @Column({ type: "text", nullable: true })
    description?: string

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    point!: number

    @Column({ nullable: true })
    image?: string

    @Column({ name: "expired_date", type: "date", nullable: true })
    expiredDate?: Date

    @ManyToOne(() => CatalogCategory, (category) => category.catalogs)
    @JoinColumn({ name: "category_id" })
    category!: Relation<CatalogCategory>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
