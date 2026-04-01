import { AppDataSource } from "../../config/database"
import { CatalogCategory } from "./entities/catalog-category.entity"
import { Repository } from "typeorm"

export class CatalogCategoryService {
    private repository: Repository<CatalogCategory>

    constructor() {
        this.repository = AppDataSource.getRepository(CatalogCategory)
    }

    async getAll() {
        return await this.repository.find({
            order: { name: "ASC" }
        })
    }
}
