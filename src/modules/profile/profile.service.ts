import { User } from "../user/entities/user.entity"
import { UpdateAccountValidator, UpdateBankValidator, UpdatePasswordValidator, UpdatePreferenceValidator } from "./validators/profile.validator"
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"
import { hashPassword, comparePassword } from "../../core/helpers/hash"
import { IUserRepository } from "../user/interfaces/user.repository.interface"
import { minio } from "../../core/helpers/minio"

export class ProfileService {
    constructor(private readonly repository: IUserRepository) {}

    async getProfile(userId: number): Promise<User> {
        const user = await this.repository.findById(userId)
        if (!user) {
            throw new NotFoundException("Profile not found")
        }
        return user
    }

    async updateAccount(userId: number, data: UpdateAccountValidator): Promise<User> {
        const user = await this.getProfile(userId)
        const merged = this.repository.merge(user, data)
        return await this.repository.save(merged)
    }

    async updateBank(userId: number, data: UpdateBankValidator): Promise<User> {
        const user = await this.getProfile(userId)
        const merged = this.repository.merge(user, data)
        return await this.repository.save(merged)
    }

    async updatePreference(userId: number, data: UpdatePreferenceValidator): Promise<User> {
        const user = await this.getProfile(userId)
        const merged = this.repository.merge(user, data)
        return await this.repository.save(merged)
    }

    async updatePassword(userId: number, data: UpdatePasswordValidator): Promise<User> {
        const user = await this.repository.findByIdWithPassword(userId)
        if (!user) {
            throw new NotFoundException("User not found")
        }

        if (user.password) {
            if (!data.oldPassword) {
                throw new BadRequestException("Old password is required")
            }
            const isValid = await comparePassword(data.oldPassword, user.password)
            if (!isValid) {
                throw new BadRequestException("Old password is incorrect")
            }
        }

        user.password = await hashPassword(data.newPassword)
        user.passwordUpdatedAt = new Date()
        return await this.repository.save(user)
    }

    async updatePhoto(userId: number, photoFile: File): Promise<User> {
        const user = await this.getProfile(userId)

        const rawExt = photoFile.type.split("/")[1]
        const ext = rawExt === "jpeg" ? "jpg" : rawExt
        const filename = `profile/${user.id}_${Date.now()}.${ext}`

        const buffer = Buffer.from(await photoFile.arrayBuffer())
        await minio.upload(filename, buffer, photoFile.type)

        user.photo = filename
        return await this.repository.save(user)
    }
}
