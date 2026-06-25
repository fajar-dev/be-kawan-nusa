import { UserRepository } from "../user/repositories/user.repository"
import { ProfileService } from "./profile.service"
import { ProfileController } from "./profile.controller"

const repository = new UserRepository()
const service = new ProfileService(repository)
export const profileController = new ProfileController(service)
