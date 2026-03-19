import { AppDataSource } from "../../config/database"
import { User } from "./entities/user.entity"
import { NotFoundException } from "../../core/exceptions/base"

export class UserService {
    private repository = AppDataSource.getRepository(User)

    async getById(id: number) {
        const user = await this.repository.findOneBy({ id })
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`)
        }
        return user
    }
}

