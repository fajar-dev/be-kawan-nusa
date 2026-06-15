import { CatalogCategory } from "./entities/catalog-category.entity"
import { ICatalogCategoryRepository } from "./interfaces/catalog-category.repository.interface"
import { NotFoundException } from "../../core/exceptions/base"

export class CatalogCategoryService {
    constructor(private readonly repository: ICatalogCategoryRepository) {}

    async getAll(): Promise<CatalogCategory[]> {
        return await this.repository.findAll()
    }

    async create(name: string): Promise<CatalogCategory> {
        const category = new CatalogCategory()
        category.name = name
        return await this.repository.save(category)
    }

    async update(id: number, name: string): Promise<CatalogCategory> {
        const category = await this.repository.findById(id)
        if (!category) {
            throw new NotFoundException("Catalog category not found")
        }
        category.name = name
        return await this.repository.save(category)
    }

    async delete(id: number): Promise<void> {
        const category = await this.repository.findById(id)
        if (!category) {
            throw new NotFoundException("Catalog category not found")
        }
        await this.repository.delete(id)
    }
}
