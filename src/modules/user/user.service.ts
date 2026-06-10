import { User } from "./entities/user.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { EntityManager } from "typeorm"
import { IUserRepository } from "./interfaces/user.repository.interface"

export class UserService {
    constructor(private readonly repository: IUserRepository) {}

    async getAll(page: number, limit: number, q: string, sort: string, order: string): Promise<{ data: any[]; total: number }> {
        return await this.repository.findAll(page, limit, q, sort, order)
    }

    async getById(id: number): Promise<User> {
        const user = await this.repository.findById(id)
        if (!user) {
            throw new NotFoundException("User not found")
        }
        return user
    }

    async getByEmail(email: string): Promise<User | null> {
        return await this.repository.findByEmail(email)
    }

    async getByIdentifier(identifier: string): Promise<User | null> {
        return await this.repository.findByIdentifier(identifier)
    }

    async getByResetToken(token: string): Promise<User | null> {
        return await this.repository.findByResetToken(token)
    }

    async getByEmailAndResetToken(email: string, token: string): Promise<User | null> {
        return await this.repository.findByEmailAndResetToken(email, token)
    }

    async save(data: Partial<User>, manager?: EntityManager): Promise<User> {
        return await this.repository.save(data, manager)
    }
}
