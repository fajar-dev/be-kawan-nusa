import { Context } from "hono"
import { CustomerServiceService } from "./customer-service.service"
import { ApiResponse } from "../../core/helpers/response"
import { CustomerServiceSerializer } from "./serializers/customer-service.serialize"

export class CustomerServiceController {
    constructor(private readonly customerService: CustomerServiceService) {}

    async index(c: Context) {
        const user = c.get("user")
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const sort = c.req.query("sort") || "referenceDate"
        const order = c.req.query("order") || "DESC"
        const startDate = c.req.query("startDate")
        const endDate = c.req.query("endDate")
        const types = c.req.queries("type[]")
        const serviceCodes = c.req.queries("serviceCode[]")

        const { data, total } = await this.customerService.getAll(user.id, page, limit, q, sort, order, {
            startDate,
            endDate,
            types,
            serviceCodes,
        })

        return ApiResponse.paginate(
            c,
            CustomerServiceSerializer.collection(data),
            total,
            page,
            limit,
            "Customer services retrieved successfully"
        )
    }

    async byCustomer(c: Context) {
        const user = c.get("user")
        const customerId = c.req.param("id") as string
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const sort = c.req.query("sort") || "referenceDate"
        const order = c.req.query("order") || "DESC"

        const { data, total } = await this.customerService.getAllByCustomer(
            customerId,
            user.id,
            page,
            limit,
            q,
            sort,
            order,
            {
                startRegistration: c.req.query("startRegistration"),
                endRegistration: c.req.query("endRegistration"),
                startActivation: c.req.query("startActivation"),
                endActivation: c.req.query("endActivation"),
                status: c.req.queries("status[]"),
            }
        )

        return ApiResponse.paginate(
            c,
            CustomerServiceSerializer.collection(data),
            total,
            page,
            limit,
            "Customer services retrieved successfully"
        )
    }

    async byService(c: Context) {
        const user = c.get("user")
        const serviceCode = c.req.param("code") as string
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const sort = c.req.query("sort") || "referenceDate"
        const order = c.req.query("order") || "DESC"

        const { data, total } = await this.customerService.getAllByService(
            serviceCode,
            user.id,
            page,
            limit,
            q,
            sort,
            order,
            {
                startRegistration: c.req.query("startRegistration"),
                endRegistration: c.req.query("endRegistration"),
                startActivation: c.req.query("startActivation"),
                endActivation: c.req.query("endActivation"),
                status: c.req.queries("status[]"),
            }
        )

        return ApiResponse.paginate(
            c,
            CustomerServiceSerializer.collection(data),
            total,
            page,
            limit,
            "Customer services retrieved successfully"
        )
    }
}
