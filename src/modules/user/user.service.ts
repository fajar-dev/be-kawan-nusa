import { AppDataSource } from "../../config/database"
import { User } from "./entities/user.entity"
import { CreateUserRequest, UpdateUserRequest } from "./dto/user.request"
import { NotFoundException } from "../../core/exceptions/base"
import { hashPassword } from "../../core/helpers/hash"

export class UserService {
    private repository = AppDataSource.getRepository(User)

    async getAll(page: number = 1, limit: number = 10) {
        const [data, total] = await this.repository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' }
        })
        return { data, total }
    }

    async getById(id: number) {
        const user = await this.repository.findOneBy({ id })
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`)
        }
        return user
    }

    async create(data: CreateUserRequest) {
        const hashedPassword = await hashPassword(data.password)
        const user = this.repository.create({
            ...data,
            password: hashedPassword
        })
        return await this.repository.save(user)
    }

    async update(id: number, data: UpdateUserRequest) {
        const user = await this.getById(id)
        
        if (data.password) {
            data.password = await hashPassword(data.password)
        }

        this.repository.merge(user, data)
        return await this.repository.save(user)
    }

    async delete(id: number) {
        const user = await this.getById(id)
        await this.repository.remove(user)
        return true
    }
}

