import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { EducationCategory } from "../../education-category/entities/education-category.entity"
import { EducationArticleView } from "./education-article-view.entity"

@Entity("education_articles")
export class EducationArticle {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "category_id" })
    categoryId!: number

    @Column()
    title!: string

    @Column({ type: "text" })
    content!: string

    @Column({ nullable: true })
    image?: string

    @Column({ nullable: true })
    author?: string

    @ManyToOne(() => EducationCategory, (category) => category.articles)
    @JoinColumn({ name: "category_id" })
    category!: Relation<EducationCategory>

    @OneToMany(() => EducationArticleView, (view) => view.article)
    views!: Relation<EducationArticleView[]>

    // Virtual properties (populated via manual mapping)
    isViewed?: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
