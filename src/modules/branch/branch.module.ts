import { BranchRepository } from "./repositories/branch.repository"
import { BranchService } from "./branch.service"
import { BranchController } from "./branch.controller"

const repository = new BranchRepository()
const service = new BranchService(repository)
export const branchController = new BranchController(service)
