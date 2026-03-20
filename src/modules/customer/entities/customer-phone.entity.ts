import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from "typeorm"
import type { Relation } from "typeorm"
import { Customer } from "./customer.entity"

@Entity("customer_phones")
export class CustomerPhone {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "customer_id" })
    customerId!: string

    @Column()
    phone!: string

    @Column({ nullable: true })
    label?: string // e.g., "Work", "Mobile", "Home"

    @ManyToOne(() => Customer, (customer) => customer.phones, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "customer_id" })
    customer!: Relation<Customer>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
