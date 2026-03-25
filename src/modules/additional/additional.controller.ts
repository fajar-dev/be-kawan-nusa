import { Context } from 'hono'
import { AdditionalService } from './additional.service'
import { ServiceService } from '../service/service.service'
import { ApiResponse } from '../../core/helpers/response'
import { AdditionalSerializer } from './serializers/additional.serialize'

export class AdditionalController {
    private additionalService: AdditionalService
    private serviceService: ServiceService

    constructor() {
        this.additionalService = new AdditionalService()
        this.serviceService = new ServiceService()
    }

    async getServices(c: Context) {
        const data = await this.serviceService.getServices()
        return ApiResponse.success(
            c, 
            AdditionalSerializer.collection(data), 
            "Additional services list retrieved successfully"
        )
    }

    async getCustomerTypes(c: Context) {
        const data = await this.additionalService.getCustomerTypes()
        return ApiResponse.success(
            c, 
            AdditionalSerializer.collection(data), 
            "Additional customer types list retrieved successfully"
        )
    }

    async getCustomerServiceStatus(c: Context) {
        const data = await this.additionalService.getCustomerServiceStatus()
        return ApiResponse.success(
            c, 
            AdditionalSerializer.collection(data), 
            "Additional customer service statuses list retrieved successfully"
        )
    }

    async getRewardPointTypes(c: Context) {
        const data = await this.additionalService.getRewardPointTypes()
        return ApiResponse.success(
            c, 
            AdditionalSerializer.collection(data), 
            "Additional reward point types list retrieved successfully"
        )
    }
}
