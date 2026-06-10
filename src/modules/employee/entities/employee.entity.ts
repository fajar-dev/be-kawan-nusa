import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import type { Relation } from "typeorm"

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

    @Column({ name: "manager_id", nullable: true })
    managerId!: number | null

    @Column({ name: "is_active", default: true })
    isActive!: boolean

    // Relations
    @ManyToOne(() => Employee, { nullable: true })
    @JoinColumn({ name: "manager_id" })
    manager?: Relation<Employee>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
