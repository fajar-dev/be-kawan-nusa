import { userRepository } from "../user/user.module"
import { ProfileService } from "./profile.service"
import { ProfileController } from "./profile.controller"

const profileService = new ProfileService(userRepository)

export const profileController = new ProfileController(profileService)
