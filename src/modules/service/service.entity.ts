import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("services")
export class Service {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @Column({ type: "text", nullable: true })
    description?: string

    @Column({
        type: "enum",
        enum: ["Internet", "Email", "Domain", "Web Hosting", "Data Cloud", "Server", "Jasa", "Business"],
        default: "Internet"
    })
    type!: string

    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
