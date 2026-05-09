import { EducationArticle } from "./entities/education-article.entity"
import { NotFoundException } from "../../core/exceptions/base"
import {
    EducationArticleListFilters,
    IEducationArticleRepository,
} from "./interfaces/education-article.repository.interface"

export class EducationArticleService {
    constructor(private readonly repository: IEducationArticleRepository) {}

    async getAll(
        page: number = 1,
        limit: number = 10,
        filters: EducationArticleListFilters = {}
    ): Promise<{ data: EducationArticle[]; total: number }> {
        const { data, total } = await this.repository.findAll(page, limit, filters)

        if (filters.currentUserId && data.length > 0) {
            const viewedIds = await this.repository.getViewedArticleIds(
                filters.currentUserId,
                data.map(a => a.id)
            )
            const viewedSet = new Set(viewedIds)
            data.forEach(a => { a.isViewed = viewedSet.has(a.id) })
        }

        return { data, total }
    }

    async getById(id: number, userId?: number): Promise<EducationArticle> {
        const article = await this.repository.findById(id)
        if (!article) {
            throw new NotFoundException("Education article not found")
        }

        if (userId) {
            const alreadyViewed = await this.repository.hasViewed(id, userId)
            if (!alreadyViewed) {
                await this.repository.recordView(id, userId)
            }
            article.isViewed = true
        }

        return article
    }
}
