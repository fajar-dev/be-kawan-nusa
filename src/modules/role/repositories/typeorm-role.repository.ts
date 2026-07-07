import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Role } from "../entities/role.entity"
import { IRoleRepository } from "../interfaces/role.repository.interface"

export class RoleRepository implements IRoleRepository {
    private readonly repository: Repository<Role>

    constructor() {
        this.repository = AppDataSource.getRepository(Role)
    }

    async findAll(page: number, limit: number, q?: string): Promise<{ data: Role[]; total: number }> {
        const query = this.repository.createQueryBuilder("role")

        if (q) {
            query.where("role.name LIKE :q", { q: `%${q}%` })
        }

        query.orderBy("role.createdAt", "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()

        return { data, total }
    }

    async findById(id: number): Promise<Role | null> {
        return await this.repository.findOneBy({ id })
    }

    async findByName(name: string): Promise<Role | null> {
        return await this.repository.findOneBy({ name })
    }

    async save(data: Partial<Role>): Promise<Role> {
        return await this.repository.save(data)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
