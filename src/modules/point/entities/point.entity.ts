import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from "typeorm"
import type { Relation } from "typeorm"
import { User } from "../../user/entities/user.entity"

@Entity("points")
export class Point {
    @PrimaryColumn({ name: "user_id" })
    userId!: number

    @Column({ type: "int", default: 0 })
    value!: number

    @OneToOne(() => User, (user) => user.point)
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
