import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { EducationVideo } from "./education-video.entity"
import { User } from "../../user/entities/user.entity"

@Entity("education_video_views")
export class EducationVideoView {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "education_video_id" })
    educationVideoId!: number

    @Index()
    @Column({ name: "user_id", nullable: true })
    userId?: number

    @ManyToOne(() => EducationVideo, (video) => video.views)
    @JoinColumn({ name: "education_video_id" })
    video!: Relation<EducationVideo>

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user?: Relation<User>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
