import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { Customer } from "../../customer/entities/customer.entity"
import { Service } from "../../service/entities/service.entity"
import { CustomerServiceStatus } from "../customer-service.enum"

@Entity("customer_services")
export class CustomerService {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "customer_id" })
    customerId!: string

    @Column({ name: "service_code" })
    serviceCode!: string

    @Column({ name: "registration_date", type: "date" })
    registrationDate!: Date

    @Column({ name: "activation_date", type: "date" })
    activationDate!: Date

    @Column({ name: "start_date", type: "date" })
    startDate!: Date

    @Column({ name: "end_date", type: "date", nullable: true })
    endDate?: Date

    @Column({
        type: "enum",
        enum: CustomerServiceStatus,
        default: CustomerServiceStatus.AC
    })
    status!: CustomerServiceStatus

    // Relations
    @ManyToOne(() => Customer, (customer) => customer.services, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "customer_id" })
    customer!: Customer

    @ManyToOne(() => Service, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "service_code", referencedColumnName: "code" })
    service!: Service

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
