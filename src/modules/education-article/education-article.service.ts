import { AppDataSource } from "../../config/database"
import { EducationArticle } from "./entities/education-article.entity"
import { EducationArticleView } from "./entities/education-article-view.entity"
import { Repository } from "typeorm"
import { NotFoundException } from "../../core/exceptions/base"

export class EducationArticleService {
    private repository: Repository<EducationArticle>

    constructor() {
        this.repository = AppDataSource.getRepository(EducationArticle)
    }

    async getAll(categoryId?: number, page: number = 1, limit: number = 10, q: string = "", currentUserId?: number, isView?: boolean) {
        const query = this.repository.createQueryBuilder("article")
            .leftJoinAndSelect("article.category", "category")

        if (categoryId) {
            query.andWhere("article.categoryId = :categoryId", { categoryId })
        }

        if (q) {
            query.andWhere("article.title LIKE :q OR article.content LIKE :q", { q: `%${q}%` })
        }

        if (currentUserId && isView !== undefined) {
            if (isView) {
                query.andWhere(qb => {
                    const subQuery = qb.subQuery()
                        .select("view.educationArticleId")
                        .from(EducationArticleView, "view")
                        .where("view.userId = :currentUserId", { currentUserId })
                        .getQuery()
                    return "article.id IN " + subQuery
                })
            } else {
                query.andWhere(qb => {
                    const subQuery = qb.subQuery()
                        .select("view.educationArticleId")
                        .from(EducationArticleView, "view")
                        .where("view.userId = :currentUserId", { currentUserId })
                        .getQuery()
                    return "article.id NOT IN " + subQuery
                })
            }
        }

        query.orderBy("article.createdAt", "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()

        if (currentUserId && data.length > 0) {
            const viewedArticleIds = await AppDataSource.getRepository(EducationArticleView)
                .createQueryBuilder("view")
                .select("view.educationArticleId")
                .where("view.userId = :currentUserId", { currentUserId })
                .andWhere("view.educationArticleId IN (:...articleIds)", { articleIds: data.map(a => a.id) })
                .getRawMany()
            
            const viewedSet = new Set(viewedArticleIds.map(v => v.view_education_article_id))
            data.forEach(a => {
                a.isViewed = viewedSet.has(a.id)
            })
        }
            
        return { data, total }
    }

    async getById(id: number, userId?: number) {
        const article = await this.repository.findOne({
            where: { id },
            relations: ["category"]
        })

        if (!article) {
            throw new NotFoundException("Education article not found")
        }

        if (userId) {
            const existingView = await AppDataSource.getRepository(EducationArticleView).findOne({
                where: { educationArticleId: id, userId }
            })

            if (!existingView) {
                await AppDataSource.getRepository(EducationArticleView).save({
                    educationArticleId: id,
                    userId: userId
                })
            }
            
            article.isViewed = true
        }

        return article
    }
}
