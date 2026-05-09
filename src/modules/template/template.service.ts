import { Template } from "./entities/template.entity"
import { ITemplateRepository } from "./interfaces/template.repository.interface"

export class TemplateService {
    constructor(private readonly repository: ITemplateRepository) {}

    async getAll(
        page: number = 1,
        limit: number = 10,
        q: string = ""
    ): Promise<{ data: Template[]; total: number }> {
        return await this.repository.findAll(page, limit, q)
    }

    async getById(id: number): Promise<Template | null> {
        return await this.repository.findById(id)
    }
}
