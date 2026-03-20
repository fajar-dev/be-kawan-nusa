import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "../../user/entities/user.entity"

@Entity("points")
export class Point {
    @PrimaryColumn({ name: "user_id" })
    userId!: number

    @Column({ type: "int", default: 0 })
    value!: number

    @Column({ name: "expired_date", type: "date" })
    expiredDate!: Date

    @OneToOne(() => User, (user) => (user as any).point)
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
