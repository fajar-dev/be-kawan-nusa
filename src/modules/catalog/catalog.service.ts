import { Catalog } from "./entities/catalog.entity"
import { ICatalogRepository } from "./interfaces/catalog.repository.interface"

export class CatalogService {
    constructor(private readonly repository: ICatalogRepository) {}

    async getAll(
        page: number = 1,
        limit: number = 10,
        q: string = "",
        categoryId?: number
    ): Promise<{ data: Catalog[]; total: number }> {
        return await this.repository.findAll(page, limit, q, categoryId)
    }

    async getById(id: number): Promise<Catalog | null> {
        return await this.repository.findById(id)
    }
}
