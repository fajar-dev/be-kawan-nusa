import { Branch } from "../entities/branch.entity"

export interface IBranchRepository {
    findAll(): Promise<Branch[]>
}
