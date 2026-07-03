import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { User } from "../entities/user.entity"
import { IUserRepository, UserListFilters } from "../interfaces/user.repository.interface"

export class UserRepository implements IUserRepository {
    private readonly repository: Repository<User>

    constructor() {
        this.repository = AppDataSource.getRepository(User)
    }

    async findAll(page: number, limit: number, q: string, sort: string, order: string, filters: UserListFilters = {}): Promise<{ data: any[]; total: number }> {
        const offset = (page - 1) * limit
        const today = new Date().toISOString().split("T")[0]

        const query = this.repository.createQueryBuilder("user")
            .select([
                "user.id AS id",
                "CONCAT(user.first_name, COALESCE(CONCAT(' ', user.last_name), '')) AS name",
                "user.photo AS photo",
                "user.email AS email",
                "user.phone AS phone",
                "user.identity_number AS identityNumber",
                "user.tax_number AS taxNumber",
                "user.account_holder_name AS accountHolderName",
                "user.bank_name AS bankName",
                "user.account_number AS accountNumber",
                "user.status AS status",
                "user.status_note AS statusNote",
                "user.company AS company",
                "user.created_at AS createdAt",
            ])
            .addSelect(subQuery => {
                return subQuery
                    .select("MAX(cs.reference_date)", "lastReferanceDate")
                    .from("customer_services", "cs")
                    .innerJoin("customer_service_referrals", "csr", "csr.customer_service_id = cs.id")
                    .where("csr.user_id = user.id")
            }, "lastReferanceDate")
            .addSelect(subQuery => {
                return subQuery
                    .select("COALESCE(SUM(r.remaining_point), 0)", "total")
                    .from("points", "r")
                    .where("r.user_id = user.id")
                    .andWhere("r.expired_date > :today", { today })
            }, "point")

        if (q) {
            query.where(
                "(user.first_name LIKE :q OR user.last_name LIKE :q OR user.email LIKE :q OR user.phone LIKE :q)",
                { q: `%${q}%` }
            )
        }

        if (filters.status !== undefined && filters.status !== "") {
            const statuses = filters.status.split(",").map(s => s.trim()).filter(Boolean)
            if (statuses.length === 1) {
                query.andWhere("user.status = :status", { status: statuses[0] })
            } else if (statuses.length > 1) {
                query.andWhere("user.status IN (:...statuses)", { statuses })
            }
        }

        if (filters.startDate) {
            query.andWhere("user.created_at >= :startDate", { startDate: filters.startDate })
        }
        if (filters.endDate) {
            query.andWhere("user.created_at <= :endDate", { endDate: filters.endDate + ' 23:59:59' })
        }

        // Get total count
        const countQuery = query.clone()
        const totalResult = await countQuery.getRawMany()
        const total = totalResult.length

        // Sort
        const sortMap: Record<string, string> = {
            name: "name",
            email: "user.email",
            phone: "user.phone",
            identityNumber: "user.identity_number",
            taxNumber: "user.tax_number",
            status: "user.status",
            lastReferanceDate: "lastReferanceDate",
            point: "point",
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

    async save(data: Partial<User>, manager?: EntityManager): Promise<User> {
        const repo = manager ? manager.getRepository(User) : this.repository
        return await repo.save(data)
    }

    merge(entity: User, data: Partial<User>): User {
        return this.repository.merge(entity, data)
    }
}
