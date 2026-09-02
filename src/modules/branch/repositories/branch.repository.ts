import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Branch } from "../entities/branch.entity"
import { IBranchRepository } from "../interfaces/branch.repository.interface"

export class BranchRepository implements IBranchRepository {
    private readonly repository: Repository<Branch>

    constructor() {
        this.repository = AppDataSource.getRepository(Branch)
    }

    async findAll(): Promise<Branch[]> {
        return await this.repository.find({ order: { name: "ASC" } })
    }
}
