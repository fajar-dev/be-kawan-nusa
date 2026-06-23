import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { userService } from "../user/user.module"
import { employeeService } from "../employee/employee.module"
import { AuthTokenService } from "../../core/helpers/auth"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { mail } from "../../core/helpers/mail"

const service = new AuthService(userService, employeeService, new AuthTokenService(), new TypeOrmUnitOfWork(), mail)
export const authController = new AuthController(service)
