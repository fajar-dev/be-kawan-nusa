import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("templates")
export class Template {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @Column({ nullable: true })
    thumbnail?: string

    @Column({ type: "text", nullable: true })
    description?: string

    @Column({ nullable: true })
    png?: string

    @Column({ nullable: true })
    jpg?: string

    @Column({ nullable: true })
    mp4?: string

    @Column({ nullable: true })
    psd?: string

    @Index()
    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
