import { Context } from "hono"
import { BranchService } from "./branch.service"
import { ApiResponse } from "../../core/helpers/response"
import { BranchSerializer } from "./serializers/branch.serialize"

export class BranchController {
    constructor(private readonly service: BranchService) {}

    async index(c: Context) {
        const branches = await this.service.getAll()
        return ApiResponse.success(c, BranchSerializer.collection(branches), "Branches retrieved successfully")
    }
}
