import { Catalog } from "../entities/catalog.entity"

export interface ICatalogRepository {
    findAll(
        page: number,
        limit: number,
        q: string,
        categoryId?: number
    ): Promise<{ data: Catalog[]; total: number }>

    findById(id: number): Promise<Catalog | null>
}
