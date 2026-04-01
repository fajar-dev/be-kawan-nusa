import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm"
import type { Relation } from "typeorm"
import { Catalog } from "../../catalog/entities/catalog.entity"

@Entity("catalog_categories")
export class CatalogCategory {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @OneToMany(() => Catalog, (catalog) => catalog.category)
    catalogs!: Relation<Catalog[]>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
