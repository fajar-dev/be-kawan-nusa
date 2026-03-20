import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm"
import { CustomerPhone } from "./customer-phone.entity"
import { CustomerEmail } from "./customer-email.entity"
import { CustomerAddress } from "./customer-address.entity"
import { CustomerType } from "../customer.enum"
import { User } from "../../user/entities/user.entity"

@Entity("customers")
export class Customer {
    @PrimaryColumn()
    id!: string

    @Column()
    name!: string

    @Column({ nullable: true })
    company?: string

    @Column({ 
        type: "enum",
        enum: CustomerType,
        nullable: true,
        default: CustomerType.OTHERS
    })
    type?: CustomerType

    @Column({ name: "activation_date", type: "date", nullable: true })
    activationDate?: Date

    @Column({ name: "registration_date", type: "date", nullable: true })
    registrationDate?: Date

    @Column({ name: "sales_name", nullable: true })
    salesName?: string

    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @Column({ name: "user_id" })
    userId!: number

    // Relations
    @OneToMany(() => CustomerPhone, (phone) => phone.customer, { cascade: true })
    phones!: CustomerPhone[]

    @OneToMany(() => CustomerEmail, (email) => email.customer, { cascade: true })
    emails!: CustomerEmail[]

    @OneToMany(() => CustomerAddress, (address) => address.customer, { cascade: true })
    addresses!: CustomerAddress[]

    @ManyToOne(() => User, (user) => user.customers)
    @JoinColumn({ name: "user_id" })
    user!: User

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
