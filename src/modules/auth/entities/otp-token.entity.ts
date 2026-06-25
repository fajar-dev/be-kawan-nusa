import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "../../user/entities/user.entity"

@Entity("otp_tokens")
export class OtpToken {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "user_id" })
    userId!: number

    @Column()
    code!: string

    @Column({ name: "expires_at", type: "timestamp" })
    expiresAt!: Date

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
