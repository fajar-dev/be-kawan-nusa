import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { userService } from "../user/user.module"
import { employeeService } from "../employee/employee.module"
import { AuthTokenService } from "../../core/helpers/auth"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { mail } from "../../core/helpers/mail"
import { PasswordResetTokenRepository } from "./repositories/password-reset-token.repository"
import { EmailVerificationTokenRepository } from "./repositories/email-verification-token.repository"
import { OtpTokenRepository } from "./repositories/otp-token.repository"
import { nusaContactHelper } from "../../core/helpers/nusacontact"

const passwordResetTokenRepository = new PasswordResetTokenRepository()
const emailVerificationTokenRepository = new EmailVerificationTokenRepository()
const otpTokenRepository = new OtpTokenRepository()
const service = new AuthService(userService, employeeService, new AuthTokenService(), new TypeOrmUnitOfWork(), mail, passwordResetTokenRepository, emailVerificationTokenRepository, otpTokenRepository, nusaContactHelper)
export const authController = new AuthController(service)
