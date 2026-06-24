import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { userService } from "../user/user.module"
import { employeeService } from "../employee/employee.module"
import { AuthTokenService } from "../../core/helpers/auth"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { mail } from "../../core/helpers/mail"
import { TypeOrmPasswordResetTokenRepository } from "./repositories/typeorm-password-reset-token.repository"
import { TypeOrmEmailVerificationTokenRepository } from "./repositories/typeorm-email-verification-token.repository"

const passwordResetTokenRepository = new TypeOrmPasswordResetTokenRepository()
const emailVerificationTokenRepository = new TypeOrmEmailVerificationTokenRepository()
const service = new AuthService(userService, employeeService, new AuthTokenService(), new TypeOrmUnitOfWork(), mail, passwordResetTokenRepository, emailVerificationTokenRepository)
export const authController = new AuthController(service)
