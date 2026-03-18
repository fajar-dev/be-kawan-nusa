import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { CustomerPhone } from "./customer-phone.entity"
import { CustomerEmail } from "./customer-email.entity"

@Entity("customers")
export class Customer {
    @PrimaryColumn()
    id!: string

    @Column()
    name!: string

    @Column({ nullable: true })
    company?: string

    @Column({ nullable: true })
    category?: string

    @Column({ name: "registration_date", type: "date", nullable: true })
    registrationDate?: Date

    @Column({ name: "activation_date", type: "date", nullable: true })
    activationDate?: Date

    @Column({ name: "sales_name", nullable: true })
    salesName?: string

    @Column({ name: "is_active", default: true })
    isActive!: boolean

    // Relations
    @OneToMany(() => CustomerPhone, (phone) => phone.customer, { cascade: true })
    phones!: CustomerPhone[]

    @OneToMany(() => CustomerEmail, (email) => email.customer, { cascade: true })
    emails!: CustomerEmail[]

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
