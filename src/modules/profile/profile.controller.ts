import { Context } from "hono"
import { ProfileService } from "./profile.service"
import { ApiResponse } from "../../core/helpers/response"
import { UpdateAccountValidator, UpdateBankValidator, UpdatePasswordValidator, UpdatePreferenceValidator, UpdatePhotoValidator } from "./validators/profile.validator"
import { UserSerializer } from "../user/serializers/user.serialize"
import { BadRequestException } from "../../core/exceptions/base"
import * as fs from 'node:fs'
import * as path from 'node:path'

export class ProfileController {
    private service: ProfileService

    constructor() {
        this.service = new ProfileService()
    }

    async show(c: Context) {
        const user = c.get('user')
        return ApiResponse.success(c, UserSerializer.single(user), "Profile retrieved successfully")
    }

    async updateAccount(c: Context) {
        const user = c.get('user')
        const body = await c.req.json() as UpdateAccountValidator
        const updated = await this.service.updateAccount(user.id, body)
        return ApiResponse.success(c, UserSerializer.single(updated), "Account updated successfully")
    }

    async updateBank(c: Context) {
        const user = c.get('user')
        const body = await c.req.json() as UpdateBankValidator
        const updated = await this.service.updateBank(user.id, body)
        return ApiResponse.success(c, UserSerializer.single(updated), "Bank details updated successfully")
    }

    async updatePreference(c: Context) {
        const user = c.get('user')
        const body = await c.req.json() as UpdatePreferenceValidator
        const updated = await this.service.updatePreference(user.id, body)
        return ApiResponse.success(c, UserSerializer.single(updated), "Preference updated successfully")
    }

    async updatePassword(c: Context) {
        const user = c.get('user')
        const body = await c.req.json() as UpdatePasswordValidator
        await this.service.updatePassword(user.id, body)
        return ApiResponse.success(c, null, "Password updated successfully")
    }

    async updatePhoto(c: Context) {
        const user = c.get('user')
        const { photo } = await c.req.parseBody() as unknown as UpdatePhotoValidator

        const ext = photo.type.split('/')[1] === 'jpeg' ? 'jpg' : photo.type.split('/')[1]
        const filename = `profile_${user.id}_${Date.now()}.${ext}`
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile')

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        const filePath = path.join(uploadDir, filename)
        const buffer = await photo.arrayBuffer()
        fs.writeFileSync(filePath, Buffer.from(buffer))

        // Updated user with direct photo location relative to public folder
        const photoUrl = `/uploads/profile/${filename}`
        const updated = await this.service.updatePhoto(user.id, photoUrl)

        return ApiResponse.success(c, UserSerializer.single(updated), "Profile photo updated successfully")
    }
}
