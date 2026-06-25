import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { CatalogCategory } from "../entities/catalog-category.entity"
import { ICatalogCategoryRepository } from "../interfaces/catalog-category.repository.interface"

export class CatalogCategoryRepository implements ICatalogCategoryRepository {
    private readonly repository: Repository<CatalogCategory>

    constructor() {
        this.repository = AppDataSource.getRepository(CatalogCategory)
    }

    async findAll(): Promise<CatalogCategory[]> {
        return await this.repository.find({ order: { name: "ASC" } })
    }

    async findById(id: number): Promise<CatalogCategory | null> {
        return await this.repository.findOne({ where: { id } })
    }

    async save(category: CatalogCategory): Promise<CatalogCategory> {
        return await this.repository.save(category)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
