import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from "typeorm"
import { Customer } from "./customer.entity"

@Entity("customer_emails")
export class CustomerEmail {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "customer_id" })
    customerId!: string

    @Column()
    email!: string

    @Column({ nullable: true })
    label?: string // e.g., "Primary", "Personal", "Work"

    @ManyToOne(() => Customer, (customer) => customer.emails, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "customer_id" })
    customer!: Customer

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
