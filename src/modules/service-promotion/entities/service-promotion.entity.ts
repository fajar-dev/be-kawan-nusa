import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm"
import type { Relation } from "typeorm"
import { Service } from "../../service/entities/service.entity"

@Entity("service_promotions")
export class ServicePromotion {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "service_code", nullable: true })
    serviceCode?: string

    @Index()
    @Column()
    title!: string

    @Column({ type: "text", nullable: true })
    description?: string

    @Column({ nullable: true })
    image?: string

    @Column()
    url!: string
    
    @Column({ name: "start_period", type: "date", nullable: true })
    startPeriod?: Date
    
    @Column({ name: "end_period", type: "date", nullable: true })
    endPeriod?: Date
    
    @Index()
    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @Index()
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date

    @ManyToOne(() => Service)
    @JoinColumn({ name: "service_code", referencedColumnName: "code" })
    service?: Relation<Service>
}
