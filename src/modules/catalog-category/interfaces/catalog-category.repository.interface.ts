import { CatalogCategory } from "../entities/catalog-category.entity"

export interface ICatalogCategoryRepository {
    findAll(): Promise<CatalogCategory[]>
    findById(id: number): Promise<CatalogCategory | null>
    save(category: CatalogCategory): Promise<CatalogCategory>
    delete(id: number): Promise<void>
}
