import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { User } from "../entities/user.entity"
import { IUserRepository } from "../interfaces/user.repository.interface"

export class TypeOrmUserRepository implements IUserRepository {
    private readonly repository: Repository<User>

    constructor() {
        this.repository = AppDataSource.getRepository(User)
    }

    async findAll(page: number, limit: number, q: string, sort: string, order: string): Promise<{ data: any[]; total: number }> {
        const offset = (page - 1) * limit
        const today = new Date().toISOString().split("T")[0]

        const query = this.repository.createQueryBuilder("user")
            .select([
                "user.id AS id",
                "CONCAT(user.first_name, COALESCE(CONCAT(' ', user.last_name), '')) AS name",
                "user.photo AS photo",
                "user.email AS email",
                "user.identity_number AS identityNumber",
                "user.tax_number AS taxNumber",
            ])
            .addSelect(subQuery => {
                return subQuery
                    .select("COUNT(cs.id)", "count")
                    .from("customer_services", "cs")
                    .where("cs.user_id = user.id")
            }, "customerServicesCount")
            .addSelect(subQuery => {
                return subQuery
                    .select("COALESCE(SUM(r.remaining_point), 0)", "total")
                    .from("rewards", "r")
                    .innerJoin("customer_services", "rcs", "rcs.id = r.customer_service_id")
                    .where("rcs.user_id = user.id")
                    .andWhere("r.expired_date > :today", { today })
            }, "point")

        if (q) {
            query.where(
                "(user.first_name LIKE :q OR user.last_name LIKE :q OR user.email LIKE :q OR user.phone LIKE :q)",
                { q: `%${q}%` }
            )
        }

        // Get total count
        const countQuery = query.clone()
        const totalResult = await countQuery.getRawMany()
        const total = totalResult.length

        // Sort
        const sortMap: Record<string, string> = {
            name: "name",
            email: "user.email",
            createdAt: "user.created_at",
        }
        const finalSort = sortMap[sort] || "user.id"
        const finalOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC"

        // Get paginated data
        const data = await query
            .orderBy(finalSort, finalOrder)
            .limit(limit)
            .offset(offset)
            .getRawMany()

        return { data, total }
    }

    async findById(id: number): Promise<User | null> {
        return await this.repository.findOneBy({ id })
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.repository.findOneBy({ email })
    }

    async findByIdentifier(identifier: string): Promise<User | null> {
        return await this.repository.createQueryBuilder("user")
            .where("user.email = :identifier OR user.phone = :identifier", { identifier })
            .addSelect("user.password")
            .getOne()
    }

    async findByIdWithPassword(id: number): Promise<User | null> {
        return await this.repository.createQueryBuilder("user")
            .where("user.id = :id", { id })
            .addSelect("user.password")
            .getOne()
    }

    async findByResetToken(token: string): Promise<User | null> {
        return await this.repository.createQueryBuilder("user")
            .where("user.reset_password_token = :token", { token })
            .andWhere("user.reset_password_expires > :now", { now: new Date() })
            .getOne()
    }

    async findByEmailAndResetToken(email: string, token: string): Promise<User | null> {
        return await this.repository.createQueryBuilder("user")
            .where("user.email = :email", { email })
            .andWhere("user.reset_password_token = :token", { token })
            .andWhere("user.reset_password_expires > :now", { now: new Date() })
            .getOne()
    }

    async save(data: Partial<User>, manager?: EntityManager): Promise<User> {
        const repo = manager ? manager.getRepository(User) : this.repository
        return await repo.save(data)
    }

    merge(entity: User, data: Partial<User>): User {
        return this.repository.merge(entity, data)
    }
}
