import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("roles")
export class Role {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @Column({ type: "text", nullable: true })
    description?: string

    @Column({ nullable: true })
    color?: string

    @Column({ type: "json" })
    permissions!: Record<string, string[]>


    @Column({ name: "is_default", default: false })
    isDefault!: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
