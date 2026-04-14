import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from "typeorm"
import type { Relation } from "typeorm"
import { ServiceType, ServiceCategory, ServiceUnit } from "../service.enum"
import { ServicePromotion } from "../../service-promotion/entities/service-promotion.entity"

@Entity("services")
export class Service {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true })
    code!: string

    @Column()
    @Index()
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
    @Index()
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
    @Index()
    type!: ServiceType

    @Index()
    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @Index()
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date

    @OneToMany(() => ServicePromotion, (promotion) => promotion.service)
    promotions!: Relation<ServicePromotion[]>
}
