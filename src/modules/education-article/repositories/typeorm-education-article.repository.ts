import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { EducationArticle } from "../entities/education-article.entity"
import { EducationArticleView } from "../entities/education-article-view.entity"
import {
    EducationArticleListFilters,
    IEducationArticleRepository,
} from "../interfaces/education-article.repository.interface"

export class TypeOrmEducationArticleRepository implements IEducationArticleRepository {
    private readonly repository: Repository<EducationArticle>
    private readonly viewRepository: Repository<EducationArticleView>

    constructor() {
        this.repository = AppDataSource.getRepository(EducationArticle)
        this.viewRepository = AppDataSource.getRepository(EducationArticleView)
    }

    async findAll(
        page: number,
        limit: number,
        filters: EducationArticleListFilters = {}
    ): Promise<{ data: EducationArticle[]; total: number }> {
        const query = this.repository.createQueryBuilder("article")
            .leftJoinAndSelect("article.category", "category")

        if (filters.categoryId) query.andWhere("article.categoryId = :categoryId", { categoryId: filters.categoryId })
        if (filters.q) query.andWhere("article.title LIKE :q OR article.content LIKE :q", { q: `%${filters.q}%` })

        if (filters.currentUserId !== undefined && filters.isView !== undefined) {
            const condition = filters.isView ? "article.id IN" : "article.id NOT IN"
            query.andWhere(qb => {
                const subQuery = qb.subQuery()
                    .select("view.educationArticleId")
                    .from(EducationArticleView, "view")
                    .where("view.userId = :currentUserId", { currentUserId: filters.currentUserId })
                    .getQuery()
                return `${condition} ${subQuery}`
            })
        }

        query.orderBy("article.createdAt", "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async findById(id: number): Promise<EducationArticle | null> {
        return await this.repository.findOne({ where: { id }, relations: ["category"] })
    }

    async getViewedArticleIds(userId: number, articleIds: number[]): Promise<number[]> {
        const views = await this.viewRepository.createQueryBuilder("view")
            .select("view.educationArticleId")
            .where("view.userId = :userId", { userId })
            .andWhere("view.educationArticleId IN (:...articleIds)", { articleIds })
            .getRawMany()
        return views.map(v => v.view_education_article_id)
    }

    async recordView(articleId: number, userId: number): Promise<void> {
        await this.viewRepository.save({ educationArticleId: articleId, userId })
    }

    async hasViewed(articleId: number, userId: number): Promise<boolean> {
        const view = await this.viewRepository.findOne({ where: { educationArticleId: articleId, userId } })
        return !!view
    }
}
