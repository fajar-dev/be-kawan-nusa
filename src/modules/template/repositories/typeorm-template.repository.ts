import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Template } from "../entities/template.entity"
import { ITemplateRepository } from "../interfaces/template.repository.interface"

export class TypeOrmTemplateRepository implements ITemplateRepository {
    private readonly repository: Repository<Template>

    constructor() {
        this.repository = AppDataSource.getRepository(Template)
    }

    async findAll(page: number, limit: number, q: string): Promise<{ data: Template[]; total: number }> {
        const query = this.repository.createQueryBuilder("template")
            .where("template.isActive = :isActive", { isActive: true })

        if (q) query.andWhere("template.name LIKE :q OR template.description LIKE :q", { q: `%${q}%` })

        query.orderBy("template.createdAt", "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async findById(id: number): Promise<Template | null> {
        return await this.repository.findOneBy({ id, isActive: true })
    }
}
