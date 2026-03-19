import { AppDataSource } from "../../config/database"
import { User } from "../user/entities/user.entity"
import { UpdateAccountRequest, UpdateBankRequest, UpdatePasswordRequest } from "./dto/profile.request"
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"
import { hashPassword, comparePassword } from "../../core/helpers/hash"

export class ProfileService {
    private repository = AppDataSource.getRepository(User)

    async getProfile(userId: number) {
        const user = await this.repository.findOneBy({ id: userId })
        if (!user) {
            throw new NotFoundException("Profile not found")
        }
        return user
    }

    async updateAccount(userId: number, data: UpdateAccountRequest) {
        const user = await this.getProfile(userId)
        this.repository.merge(user, data)
        return await this.repository.save(user)
    }

    async updateBank(userId: number, data: UpdateBankRequest) {
        const user = await this.getProfile(userId)
        this.repository.merge(user, data)
        return await this.repository.save(user)
    }

    async updatePassword(userId: number, data: UpdatePasswordRequest) {
        const user = await this.repository.createQueryBuilder("user")
            .where("user.id = :id", { id: userId })
            .addSelect("user.password")
            .getOne()

        if (!user) {
            throw new NotFoundException("User not found")
        }

        const isValid = await comparePassword(data.oldPassword, user.password)
        if (!isValid) {
            throw new BadRequestException("Old password is incorrect")
        }

        user.password = await hashPassword(data.newPassword)
        return await this.repository.save(user)
    }
}
