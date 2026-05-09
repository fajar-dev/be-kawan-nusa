import { CatalogCategory } from "./entities/catalog-category.entity"
import { ICatalogCategoryRepository } from "./interfaces/catalog-category.repository.interface"

export class CatalogCategoryService {
    constructor(private readonly repository: ICatalogCategoryRepository) {}

    async getAll(): Promise<CatalogCategory[]> {
        return await this.repository.findAll()
    }
}
