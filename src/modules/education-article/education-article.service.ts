import { AppDataSource } from "../../config/database"
import { EducationArticle } from "./entities/education-article.entity"
import { Repository } from "typeorm"

export class EducationArticleService {
    private repository: Repository<EducationArticle>

    constructor() {
        this.repository = AppDataSource.getRepository(EducationArticle)
    }

    async getAll(categoryId?: number, page: number = 1, limit: number = 10, q: string = "") {
        const query = this.repository.createQueryBuilder("article")
            .leftJoinAndSelect("article.category", "category")

        if (categoryId) {
            query.andWhere("article.categoryId = :categoryId", { categoryId })
        }

        if (q) {
            query.andWhere("article.title LIKE :q OR article.content LIKE :q", { q: `%${q}%` })
        }

        query.orderBy("article.createdAt", "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()
            
        return { data, total }
    }

    async getById(id: number) {
        return await this.repository.findOne({
            where: { id },
            relations: ["category"]
        })
    }
}
