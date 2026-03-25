import { AppDataSource } from "../../config/database"
import { User } from "../user/entities/user.entity"
import { UpdateAccountValidator, UpdateBankValidator, UpdatePasswordValidator, UpdatePreferenceValidator } from "./validators/profile.validator"
import { NotFoundException, BadValidatorException } from "../../core/exceptions/base"
import { hashPassword, comparePassword } from "../../core/helpers/hash"
import { Repository } from "typeorm"

export class ProfileService {
    private repository: Repository<User>

    constructor() {
        this.repository = AppDataSource.getRepository(User)
    }

    async getProfile(userId: number) {
        const user = await this.repository.findOneBy({ id: userId })
        if (!user) {
            throw new NotFoundException("Profile not found")
        }
        return user
    }

    async updateAccount(userId: number, data: UpdateAccountValidator) {
        const user = await this.getProfile(userId)
        this.repository.merge(user, data)
        return await this.repository.save(user)
    }

    async updateBank(userId: number, data: UpdateBankValidator) {
        const user = await this.getProfile(userId)
        this.repository.merge(user, data)
        return await this.repository.save(user)
    }

    async updatePreference(userId: number, data: UpdatePreferenceValidator) {
        const user = await this.getProfile(userId)
        this.repository.merge(user, data)
        return await this.repository.save(user)
    }

    async updatePassword(userId: number, data: UpdatePasswordValidator) {
        const user = await this.repository.createQueryBuilder("user")
            .where("user.id = :id", { id: userId })
            .addSelect("user.password")
            .getOne()

        if (!user) {
            throw new NotFoundException("User not found")
        }

        const isValid = await comparePassword(data.oldPassword, user.password)
        if (!isValid) {
            throw new BadValidatorException("Old password is incorrect")
        }

        user.password = await hashPassword(data.newPassword)
        return await this.repository.save(user)
    }

    async updatePhoto(userId: number, photo: string) {
        const user = await this.getProfile(userId)
        user.photo = photo
        return await this.repository.save(user)
    }
}
