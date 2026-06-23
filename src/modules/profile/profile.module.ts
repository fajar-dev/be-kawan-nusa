import { TypeOrmUserRepository } from "../user/repositories/typeorm-user.repository"
import { ProfileService } from "./profile.service"
import { ProfileController } from "./profile.controller"

const repository = new TypeOrmUserRepository()
const service = new ProfileService(repository)
export const profileController = new ProfileController(service)
