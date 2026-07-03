import { EducationArticle } from "../entities/education-article.entity"

export interface EducationArticleListFilters {
    categoryId?: number
    q?: string
    currentUserId?: number
    isView?: boolean
    startDate?: string
    endDate?: string
}

export interface IEducationArticleRepository {
    findAll(
        page: number,
        limit: number,
        filters?: EducationArticleListFilters
    ): Promise<{ data: EducationArticle[]; total: number }>

    findById(id: number): Promise<EducationArticle | null>

    getViewedArticleIds(userId: number, articleIds: number[]): Promise<number[]>

    recordView(articleId: number, userId: number): Promise<void>

    hasViewed(articleId: number, userId: number): Promise<boolean>

    save(article: EducationArticle): Promise<EducationArticle>

    delete(id: number): Promise<void>
}
