import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm"
import type { Relation } from "typeorm"
import { EducationArticle } from "./education-article.entity"
import { User } from "../../user/entities/user.entity"

@Entity("education_article_views")
export class EducationArticleView {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "article_id" })
    articleId!: number

    @Index()
    @Column({ name: "user_id", nullable: true })
    userId?: number

    @ManyToOne(() => EducationArticle, (article) => article.views)
    @JoinColumn({ name: "article_id" })
    article!: Relation<EducationArticle>

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user?: Relation<User>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
