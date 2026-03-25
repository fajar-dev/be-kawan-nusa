import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"
import { ServiceType } from "../service.enum"

@Entity("services")
export class Service {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true })
    code!: string

    @Column()
    name!: string

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
