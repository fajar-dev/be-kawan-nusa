import { Context } from 'hono'
import { AdditionalService } from './additional.service'
import { ApiResponse } from '../../core/helpers/response'
import { AdditionalResource } from './dto/additional.resource'

export class AdditionalController {
    private service: AdditionalService

    constructor() {
        this.service = new AdditionalService()
    }

    /**
     * Get all services with code and name
     */
    async getServices(c: Context) {
        const data = await this.service.getServices()
        return ApiResponse.success(
            c, 
            AdditionalResource.collection(data), 
            "Additional services list retrieved successfully"
        )
    }

    /**
     * Get all customer types
     */
    async getCustomerTypes(c: Context) {
        const data = await this.service.getCustomerTypes()
        return ApiResponse.success(
            c, 
            AdditionalResource.collection(data), 
            "Additional customer types list retrieved successfully"
        )
    }

    /**
     * Get all customer service statuses
     */
    async getCustomerServiceStatus(c: Context) {
        const data = await this.service.getCustomerServiceStatus()
        return ApiResponse.success(
            c, 
            AdditionalResource.collection(data), 
            "Additional customer service statuses list retrieved successfully"
        )
    }
}
