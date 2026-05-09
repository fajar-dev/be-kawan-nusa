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
        categoryId?: number
    ): Promise<{ data: Catalog[]; total: number }> {
        const query = this.repository.createQueryBuilder("catalog")
            .leftJoinAndSelect("catalog.category", "category")
            .where(new Brackets(qb => {
                qb.where("catalog.expiredDate IS NULL")
                  .orWhere("catalog.expiredDate >= :today", { today: new Date().toISOString().split("T")[0] })
            }))

        if (categoryId) query.andWhere("catalog.categoryId = :categoryId", { categoryId })
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
}
