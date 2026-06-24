import { Context } from "hono"
import { ProfileService } from "./profile.service"
import { ApiResponse } from "../../core/helpers/response"
import {
    UpdateAccountValidator,
    UpdateBankValidator,
    UpdatePreferenceValidator,
    UpdatePasswordValidator,
    UpdatePhotoValidator,
} from "./validators/profile.validator"
import { UserSerializer } from "../user/serializers/user.serialize"

export class ProfileController {
    constructor(private readonly service: ProfileService) {}

    async show(c: Context) {
        const user = c.get("user")
        return ApiResponse.success(c, await UserSerializer.single(user), "Profile retrieved successfully")
    }

    async updateAccount(c: Context) {
        const user = c.get("user")
        const body = await c.req.json() as UpdateAccountValidator
        const updated = await this.service.updateAccount(user.id, body)
        return ApiResponse.success(c, await UserSerializer.single(updated), "Account updated successfully")
    }

    async updateBank(c: Context) {
        const user = c.get("user")
        const body = await c.req.json() as UpdateBankValidator
        const updated = await this.service.updateBank(user.id, body)
        return ApiResponse.success(c, await UserSerializer.single(updated), "Bank details updated successfully")
    }

    async updatePreference(c: Context) {
        const user = c.get("user")
        const body = await c.req.json() as UpdatePreferenceValidator
        const updated = await this.service.updatePreference(user.id, body)
        return ApiResponse.success(c, await UserSerializer.single(updated), "Preference updated successfully")
    }

    async updatePassword(c: Context) {
        const user = c.get("user")
        const body = await c.req.json() as UpdatePasswordValidator
        await this.service.updatePassword(user.id, body)
        return ApiResponse.success(c, null, "Password updated successfully")
    }

    async updatePhoto(c: Context) {
        const user = c.get("user")
        const { photo } = await c.req.parseBody() as unknown as UpdatePhotoValidator

        const updated = await this.service.updatePhoto(user.id, photo)

        return ApiResponse.success(c, await UserSerializer.single(updated), "Profile photo updated successfully")
    }

    async completeBoarding(c: Context) {
        const user = c.get("user")
        const updated = await this.service.completeBoarding(user.id)
        return ApiResponse.success(c, await UserSerializer.single(updated), "Boarding completed successfully")
    }

    async updateDocuments(c: Context) {
        const user = c.get("user")
        const { identity, account } = await c.req.parseBody() as { identity?: File, account?: File }
        const updated = await this.service.updateDocuments(user.id, identity, account)
        return ApiResponse.success(c, await UserSerializer.single(updated), "Documents updated successfully")
    }
}
