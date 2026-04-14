import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm"
import type { Relation } from "typeorm"
import { EducationArticle } from "../../education-article/entities/education-article.entity"
import { EducationVideo } from "../../education-video/entities/education-video.entity"

@Entity("education_categories")
export class EducationCategory {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column()
    name!: string

    @OneToMany(() => EducationArticle, (article) => article.category)
    articles!: Relation<EducationArticle[]>

    @OneToMany(() => EducationVideo, (video) => video.category)
    videos!: Relation<EducationVideo[]>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
