import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import type { Relation } from "typeorm"
import { Customer } from "../../customer/entities/customer.entity"

@Entity("branches")
export class Branch {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true })
    code!: string

    @Column()
    name!: string

    @OneToMany(() => Customer, (customer) => customer.branch)
    customers!: Relation<Customer[]>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
