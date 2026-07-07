import { RoleRepository } from "./repositories/typeorm-role.repository"
import { RoleService } from "./role.service"
import { RoleController } from "./role.controller"

const repository = new RoleRepository()
const service = new RoleService(repository)
const controller = new RoleController(service)

export const roleController = controller
export const roleService = service
