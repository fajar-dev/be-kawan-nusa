import { EntityManager } from "typeorm"
import { User } from "../entities/user.entity"

export interface IUserRepository {
    findAll(page: number, limit: number, q: string, sort: string, order: string): Promise<{ data: any[]; total: number }>
    findById(id: number): Promise<User | null>
    findByEmail(email: string): Promise<User | null>
    findByIdentifier(identifier: string): Promise<User | null>
    findByIdWithPassword(id: number): Promise<User | null>
    findByResetToken(token: string): Promise<User | null>
    findByEmailAndResetToken(email: string, token: string): Promise<User | null>
    save(data: Partial<User>, manager?: EntityManager): Promise<User>
    merge(entity: User, data: Partial<User>): User
}

