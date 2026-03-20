import { Context } from "hono"
import { ProfileService } from "./profile.service"
import { ApiResponse } from "../../core/helpers/apiResponse"
import { UpdateAccountRequest, UpdateBankRequest, UpdatePasswordRequest, UpdatePreferenceRequest } from "./dto/profile.request"
import { UserResource } from "../user/dto/user.resource"

export class ProfileController {
    private service: ProfileService

    constructor() {
        this.service = new ProfileService()
    }

    async show(c: Context) {
        const user = c.get('user')
        return ApiResponse.success(c, UserResource.single(user), "Profile retrieved successfully")
    }

    async updateAccount(c: Context) {
        const user = c.get('user')
        const body = await c.req.json() as UpdateAccountRequest
        const updated = await this.service.updateAccount(user.id, body)
        return ApiResponse.success(c, UserResource.single(updated), "Account updated successfully")
    }

    async updateBank(c: Context) {
        const user = c.get('user')
        const body = await c.req.json() as UpdateBankRequest
        const updated = await this.service.updateBank(user.id, body)
        return ApiResponse.success(c, UserResource.single(updated), "Bank details updated successfully")
    }

    async updatePreference(c: Context) {
        const user = c.get('user')
        const body = await c.req.json() as UpdatePreferenceRequest
        const updated = await this.service.updatePreference(user.id, body)
        return ApiResponse.success(c, UserResource.single(updated), "Preference updated successfully")
    }

    async updatePassword(c: Context) {
        const user = c.get('user')
        const body = await c.req.json() as UpdatePasswordRequest
        await this.service.updatePassword(user.id, body)
        return ApiResponse.success(c, null, "Password updated successfully")
    }
}
