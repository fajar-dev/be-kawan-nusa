import { Context } from "hono"
import { AdditionalService } from "./additional.service"
import { ServiceService } from "../service/service.service"
import { ApiResponse } from "../../core/helpers/response"
import { AdditionalSerializer } from "./serializers/additional.serialize"

export class AdditionalController {
    constructor(
        private readonly additionalService: AdditionalService,
        private readonly serviceService: ServiceService
    ) {}

    async getServices(c: Context) {
        const data = await this.serviceService.getServices()
        return ApiResponse.success(c, AdditionalSerializer.collection(data), "Additional services list retrieved successfully")
    }

    async getCustomerTypes(c: Context) {
        const data = await this.additionalService.getCustomerTypes()
        return ApiResponse.success(c, AdditionalSerializer.collection(data), "Additional customer types list retrieved successfully")
    }

    async getCustomerServiceStatus(c: Context) {
        const data = await this.additionalService.getCustomerServiceStatus()
        return ApiResponse.success(c, AdditionalSerializer.collection(data), "Additional customer service statuses list retrieved successfully")
    }

    async getRewardPointTypes(c: Context) {
        const data = await this.additionalService.getRewardPointTypes()
        return ApiResponse.success(c, AdditionalSerializer.collection(data), "Additional reward point types list retrieved successfully")
    }

    async getServiceCategories(c: Context) {
        const data = await this.additionalService.getServiceCategories()
        return ApiResponse.success(c, AdditionalSerializer.collection(data), "Additional service categories list retrieved successfully")
    }

    async search(c: Context) {
        const q = c.req.query("q") || ""
        const user = c.get("user")
        const data = await this.additionalService.search(q, user?.id)
        return ApiResponse.success(c, data, "Search results retrieved successfully")
    }
}
