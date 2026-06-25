import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Template } from "../entities/template.entity"
import { ITemplateRepository } from "../interfaces/template.repository.interface"

export class TemplateRepository implements ITemplateRepository {
    private readonly repository: Repository<Template>

    constructor() {
        this.repository = AppDataSource.getRepository(Template)
    }

    async findAll(page: number, limit: number, q: string, showAll?: boolean): Promise<{ data: Template[]; total: number }> {
        const query = this.repository.createQueryBuilder("template")

        if (!showAll) {
            query.where("template.isActive = :isActive", { isActive: true })
        }

        if (q) {
            if (!showAll) {
                query.andWhere("(template.name LIKE :q OR template.description LIKE :q)", { q: `%${q}%` })
            } else {
                query.where("template.name LIKE :q OR template.description LIKE :q", { q: `%${q}%` })
            }
        }

        query.orderBy("template.createdAt", "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async findById(id: number, showAll?: boolean): Promise<Template | null> {
        if (showAll) {
            return await this.repository.findOneBy({ id })
        }
        return await this.repository.findOneBy({ id, isActive: true })
    }

    async save(template: Template): Promise<Template> {
        return await this.repository.save(template)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
