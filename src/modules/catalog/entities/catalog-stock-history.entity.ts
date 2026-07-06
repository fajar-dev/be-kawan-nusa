import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { Catalog } from "./catalog.entity"
import { Employee } from "../../employee/entities/employee.entity"
import { User } from "../../user/entities/user.entity"
import { StockHistoryType } from "../catalog.enum"

@Entity("catalog_stock_histories")
export class CatalogStockHistory {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "catalog_id" })
    catalogId!: number

    @Column({
        type: "enum",
        enum: StockHistoryType,
    })
    type!: StockHistoryType

    @Column({ type: "int" })
    quantity!: number

    @Column({ name: "stock_before", type: "int" })
    stockBefore!: number

    @Column({ name: "stock_after", type: "int" })
    stockAfter!: number

    @Column({ type: "text", nullable: true })
    notes?: string

    @Index()
    @Column({ name: "created_by_id", nullable: true })
    createdById?: number

    @ManyToOne(() => Catalog)
    @JoinColumn({ name: "catalog_id" })
    catalog!: Relation<Catalog>

    @ManyToOne(() => Employee, { nullable: true })
    @JoinColumn({ name: "created_by_id" })
    createdBy?: Relation<Employee>

    @Index()
    @Column({ name: "user_id", nullable: true })
    userId?: number

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "user_id" })
    user?: Relation<User>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
