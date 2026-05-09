import { CatalogCategory } from "../entities/catalog-category.entity"

export interface ICatalogCategoryRepository {
    findAll(): Promise<CatalogCategory[]>
}
