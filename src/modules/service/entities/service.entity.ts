import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"
import { ServiceType, ServiceCategory, ServiceUnit } from "../service.enum"

@Entity("services")
export class Service {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true })
    code!: string

    @Column()
    name!: string

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    price!: number

    @Column({
        type: "set",
        enum: ServiceUnit,
        default: [ServiceUnit.MONTHLY]
    })
    unit!: ServiceUnit[]

    @Column({
        type: "enum",
        enum: ServiceCategory,
        default: ServiceCategory.ACCESS_BUSINESS
    })
    category!: ServiceCategory

    @Column({ type: "json", nullable: true })
    features?: any

    @Column({ nullable: true })
    url?: string

    @Column({ type: "text", nullable: true })
    description?: string

    @Column({
        type: "enum",
        enum: ServiceType,
        default: ServiceType.INTERNET
    })
    type!: ServiceType

    @Index()
    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
