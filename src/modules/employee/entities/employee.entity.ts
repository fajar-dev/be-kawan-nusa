import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("employees")
export class Employee {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "employee_id", unique: true })
    employeeId!: string

    @Column()
    name!: string

    @Column({ unique: true })
    email!: string

    @Column({ nullable: true })
    photo?: string

    @Column({ name: "job_position", nullable: true })
    jobPosition?: string

    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
