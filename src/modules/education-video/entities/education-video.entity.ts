import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { EducationCategory } from "../../education-category/entities/education-category.entity"
import { EducationVideoView } from "./education-video-view.entity"

@Entity("education_videos")
export class EducationVideo {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "category_id" })
    categoryId!: number

    @Column()
    title!: string

    @Column()
    url!: string

    @Column({ nullable: true })
    thumbnail?: string

    @Column({ type: "text", nullable: true })
    description?: string

    @Column({ nullable: true })
    author?: string

    @ManyToOne(() => EducationCategory, (category) => category.videos)
    @JoinColumn({ name: "category_id" })
    category!: Relation<EducationCategory>

    @OneToMany(() => EducationVideoView, (view) => view.video)
    views!: Relation<EducationVideoView[]>

    // Virtual properties (populated via manual mapping)
    isViewed?: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
