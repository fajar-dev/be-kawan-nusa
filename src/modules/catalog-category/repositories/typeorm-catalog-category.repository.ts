import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { CatalogCategory } from "../entities/catalog-category.entity"
import { ICatalogCategoryRepository } from "../interfaces/catalog-category.repository.interface"

export class TypeOrmCatalogCategoryRepository implements ICatalogCategoryRepository {
    private readonly repository: Repository<CatalogCategory>

    constructor() {
        this.repository = AppDataSource.getRepository(CatalogCategory)
    }

    async findAll(): Promise<CatalogCategory[]> {
        return await this.repository.find({ order: { name: "ASC" } })
    }
}
