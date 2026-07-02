import { User } from "./entities/user.entity"
import { UserStatus } from "./user.enum"
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"
import { EntityManager } from "typeorm"
import { IUserRepository, UserListFilters } from "./interfaces/user.repository.interface"

export class UserService {
    constructor(private readonly repository: IUserRepository) {}

    async getAll(page: number, limit: number, q: string, sort: string, order: string, filters: UserListFilters = {}): Promise<{ data: any[]; total: number }> {
        return await this.repository.findAll(page, limit, q, sort, order, filters)
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

    async save(data: Partial<User>, manager?: EntityManager): Promise<User> {
        return await this.repository.save(data, manager)
    }

    async updateStatus(id: number, status: UserStatus, note: string): Promise<User> {
        const user = await this.repository.findById(id)
        if (!user) {
            throw new NotFoundException("User not found")
        }

        const allowedFromStatuses = [UserStatus.PENDING, UserStatus.REVISION, UserStatus.REJECT]
        if (!allowedFromStatuses.includes(user.status)) {
            throw new BadRequestException(`Cannot change status from '${user.status}'`)
        }

        user.status = status
        user.statusNote = note
        user.statusUpdatedAt = new Date()

        return await this.repository.save(user)
    }
}
