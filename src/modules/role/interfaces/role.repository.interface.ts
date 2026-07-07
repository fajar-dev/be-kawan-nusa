import { Role } from "../entities/role.entity"

export interface IRoleRepository {
    findAll(page: number, limit: number, q?: string): Promise<{ data: Role[]; total: number }>
    findById(id: number): Promise<Role | null>
    findByName(name: string): Promise<Role | null>
    save(data: Partial<Role>): Promise<Role>
    delete(id: number): Promise<void>
}
