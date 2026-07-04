import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "./user.entity"
import { Employee } from "../../employee/entities/employee.entity"
import { UserStatus } from "../user.enum"

@Entity("user_status_histories")
export class UserStatusHistory {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "user_id" })
    userId!: number

    @Column({ name: "from_status", type: "enum", enum: UserStatus, nullable: true })
    fromStatus!: UserStatus | null

    @Column({ name: "to_status", type: "enum", enum: UserStatus })
    toStatus!: UserStatus

    @Column({ type: "text", nullable: true })
    note!: string | null

    @Column({ name: "changed_by_id" })
    changedById!: number

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @ManyToOne(() => Employee)
    @JoinColumn({ name: "changed_by_id" })
    changedBy!: Relation<Employee>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
