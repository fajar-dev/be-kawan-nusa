import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("service_promotions")
export class ServicePromotion {
    @PrimaryGeneratedColumn()
    id!: number

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

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
