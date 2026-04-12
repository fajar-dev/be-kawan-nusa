import { AppDataSource } from "../../config/database"
import { Template } from "./entities/template.entity"
import { Repository } from "typeorm"

export class TemplateService {
    private repository: Repository<Template>

    constructor() {
        this.repository = AppDataSource.getRepository(Template)
    }

    async getAll(page: number = 1, limit: number = 10, q: string = "") {
        const query = this.repository.createQueryBuilder("template")
            .where("template.isActive = :isActive", { isActive: true })

        if (q) {
            query.andWhere("template.name LIKE :q OR template.description LIKE :q", { q: `%${q}%` })
        }

        query.orderBy("template.createdAt", "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()
            
        return { data, total }
    }

    async getById(id: number) {
        return await this.repository.findOneBy({ id, isActive: true })
    }
}
