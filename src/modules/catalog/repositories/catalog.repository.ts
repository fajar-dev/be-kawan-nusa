import { Brackets, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Catalog } from "../entities/catalog.entity"
import { ICatalogRepository } from "../interfaces/catalog.repository.interface"

export class CatalogRepository implements ICatalogRepository {
    private readonly repository: Repository<Catalog>

    constructor() {
        this.repository = AppDataSource.getRepository(Catalog)
    }

    async findAll(
        page: number,
        limit: number,
        q: string,
        categoryIds?: number[],
        types?: string[],
        sort: string = "createdAt",
        order: string = "DESC"
    ): Promise<{ data: Catalog[]; total: number }> {
        const query = this.repository.createQueryBuilder("catalog")
            .leftJoinAndSelect("catalog.category", "category")
            .leftJoinAndSelect("catalog.createdBy", "createdBy")
            .where(new Brackets(qb => {
                qb.where("catalog.expiredDate IS NULL")
                  .orWhere("catalog.expiredDate >= :today", { today: new Date().toISOString().split("T")[0] })
            }))

        if (categoryIds && categoryIds.length > 0) {
            query.andWhere("catalog.categoryId IN (:...categoryIds)", { categoryIds })
        }
        if (types && types.length > 0) {
            query.andWhere("catalog.type IN (:...types)", { types })
        }
        if (q) query.andWhere("catalog.name LIKE :q OR catalog.description LIKE :q", { q: `%${q}%` })

        const sortAlias = sort.includes(".") ? sort : `catalog.${sort}`
        query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async findById(id: number): Promise<Catalog | null> {
        return await this.repository.createQueryBuilder("catalog")
            .leftJoinAndSelect("catalog.category", "category")
            .leftJoinAndSelect("catalog.createdBy", "createdBy")
            .where("catalog.id = :id", { id })
            .getOne()
    }

    async save(catalog: Catalog): Promise<Catalog> {
        return await this.repository.save(catalog)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }

    async incrementStockUsed(id: number, amount: number = 1): Promise<void> {
        await this.repository.increment({ id }, "stockUsed", amount)
    }
}
