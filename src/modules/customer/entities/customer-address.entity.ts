import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"
import type { Relation } from "typeorm"
import { Customer } from "./customer.entity"

@Entity("customer_addresses")
export class CustomerAddress {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "customer_id" })
    customerId!: string

    @Column({ type: "text" })
    address!: string

    @Column({ nullable: true })
    city?: string

    @Column({ nullable: true })
    province?: string

    @Column({ name: "postal_code", nullable: true })
    postalCode?: string

    @Column({ nullable: true })
    label?: string // e.g., "Home", "Office", "Billing"

    @ManyToOne(() => Customer, (customer) => customer.addresses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "customer_id" })
    customer!: Relation<Customer>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
