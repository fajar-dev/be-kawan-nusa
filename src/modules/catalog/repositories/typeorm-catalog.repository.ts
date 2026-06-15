import { Brackets, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Catalog } from "../entities/catalog.entity"
import { ICatalogRepository } from "../interfaces/catalog.repository.interface"

export class TypeOrmCatalogRepository implements ICatalogRepository {
    private readonly repository: Repository<Catalog>

    constructor() {
        this.repository = AppDataSource.getRepository(Catalog)
    }

    async findAll(
        page: number,
        limit: number,
        q: string,
        categoryIds?: number[],
        types?: string[]
    ): Promise<{ data: Catalog[]; total: number }> {
        const query = this.repository.createQueryBuilder("catalog")
            .leftJoinAndSelect("catalog.category", "category")
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

        query.orderBy("catalog.createdAt", "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async findById(id: number): Promise<Catalog | null> {
        return await this.repository.createQueryBuilder("catalog")
            .leftJoinAndSelect("catalog.category", "category")
            .where("catalog.id = :id", { id })
            .getOne()
    }

    async save(catalog: Catalog): Promise<Catalog> {
        return await this.repository.save(catalog)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
