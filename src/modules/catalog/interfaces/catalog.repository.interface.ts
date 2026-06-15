import { Catalog } from "../entities/catalog.entity"

export interface ICatalogRepository {
    findAll(
        page: number,
        limit: number,
        q: string,
        categoryIds?: number[],
        types?: string[],
        sort?: string,
        order?: string
    ): Promise<{ data: Catalog[]; total: number }>

    findById(id: number): Promise<Catalog | null>

    save(catalog: Catalog): Promise<Catalog>

    delete(id: number): Promise<void>
}
