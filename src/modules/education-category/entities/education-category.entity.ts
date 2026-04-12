import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import type { Relation } from "typeorm"
import { EducationArticle } from "../../education-article/entities/education-article.entity"

@Entity("education_categories")
export class EducationCategory {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @OneToMany(() => EducationArticle, (article) => article.category)
    articles!: Relation<EducationArticle[]>

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
