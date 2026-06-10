import { userService } from "../user/user.module"
import { employeeService } from "../employee/employee.module"
import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"

const authService = new AuthService(userService, employeeService)

export const authController = new AuthController(authService)
