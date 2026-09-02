import { Branch } from "./entities/branch.entity"
import { IBranchRepository } from "./interfaces/branch.repository.interface"

export class BranchService {
    constructor(private readonly repository: IBranchRepository) {}

    async getAll(): Promise<Branch[]> {
        return await this.repository.findAll()
    }
}
