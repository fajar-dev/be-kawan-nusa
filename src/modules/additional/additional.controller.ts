import { Context } from "hono"
import { AdditionalService } from "./additional.service"
import { ServiceService } from "../service/service.service"
import { EmployeeService } from "../employee/employee.service"
import { ApiResponse } from "../../core/helpers/response"
import { AdditionalSerializer } from "./serializers/additional.serialize"

export class AdditionalController {
    constructor(
        private readonly additionalService: AdditionalService,
        private readonly serviceService: ServiceService,
        private readonly employeeService: EmployeeService
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

    async getPointTypes(c: Context) {
        const data = await this.additionalService.getPointTypes()
        return ApiResponse.success(c, AdditionalSerializer.collection(data), "Additional point types list retrieved successfully")
    }

    async getServiceCategories(c: Context) {
        const data = await this.additionalService.getServiceCategories()
        return ApiResponse.success(c, AdditionalSerializer.collection(data), "Additional service categories list retrieved successfully")
    }

    async getEmployees(c: Context) {
        const employees = await this.employeeService.getActiveEmployees()
        const data = employees.map(e => ({ code: e.employeeId, name: e.name }))
        return ApiResponse.success(c, data, "Additional employees list retrieved successfully")
    }

    async search(c: Context) {
        const q = c.req.query("q") || ""
        const user = c.get("user")
        const data = await this.additionalService.search(q, user?.id)
        return ApiResponse.success(c, data, "Search results retrieved successfully")
    }
}
