import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { CustomerPhone } from "./customer-phone.entity"
import { CustomerEmail } from "./customer-email.entity"

import { CustomerType } from "../customer.enum"
import { CustomerService as CustomerServiceObject } from "../../customer-service/entities/customer-service.entity"
import { User } from "../../user/entities/user.entity"

@Entity("customers")
export class Customer {
    @PrimaryColumn()
    id!: string

    @Index()
    @Column()
    name!: string

    @Column({ nullable: true })
    company?: string

    @Index()
    @Column({
        type: "enum",
        enum: CustomerType,
        nullable: true,
        default: CustomerType.OTHERS
    })
    type?: CustomerType

    @Column({ name: "registration_date", type: "date", nullable: true })
    registrationDate?: Date

    @Index()
    @Column({ name: "is_active", default: true })
    isActive!: boolean

    // Relations
    @OneToMany(() => CustomerPhone, (phone) => phone.customer, { cascade: true })
    phones!: Relation<CustomerPhone[]>

    @OneToMany(() => CustomerEmail, (email) => email.customer, { cascade: true })
    emails!: Relation<CustomerEmail[]>

    @OneToMany(() => CustomerServiceObject, (service) => service.customer)
    services!: Relation<CustomerServiceObject[]>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
