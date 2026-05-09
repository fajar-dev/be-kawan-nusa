import { TypeOrmUserRepository } from "./repositories/typeorm-user.repository"
import { UserService } from "./user.service"

export const userRepository = new TypeOrmUserRepository()
export const userService = new UserService(userRepository)
