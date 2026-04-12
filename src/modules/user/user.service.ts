import { AppDataSource } from "../../config/database"
import { User } from "./entities/user.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { EntityManager, Repository } from "typeorm"

export class UserService {
    private repository: Repository<User>

    constructor() {
        this.repository = AppDataSource.getRepository(User)
    }

    async getById(id: number) {
        const user = await this.repository.findOneBy({ id })
        if (!user) {
            throw new NotFoundException("User not found")
        }
        return user
    }

    async getByEmail(email: string) {
        return await this.repository.findOneBy({ email })
    }

    async getByIdentifier(identifier: string) {
        return await this.repository.createQueryBuilder("user")
            .where("user.email = :identifier OR user.phone = :identifier", { identifier })
            .addSelect("user.password")
            .getOne()
    }

    async getByResetToken(token: string) {
        return await this.repository.createQueryBuilder("user")
            .where("user.reset_password_token = :token", { token })
            .andWhere("user.reset_password_expires > :now", { now: new Date() })
            .getOne()
    }

    async getByEmailAndResetToken(email: string, token: string) {
        return await this.repository.createQueryBuilder("user")
            .where("user.email = :email", { email })
            .andWhere("user.reset_password_token = :token", { token })
            .andWhere("user.reset_password_expires > :now", { now: new Date() })
            .getOne()
    }

    async save(data: any, manager?: EntityManager) {
        const repo = manager ? manager.getRepository(User) : this.repository
        return await repo.save(data)
    }
}

