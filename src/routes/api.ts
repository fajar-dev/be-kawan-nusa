import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ApiResponse } from '../core/helpers/apiResponse'
import { CustomerController } from '../modules/customer/customer.controller'
import { CustomerServiceController } from '../modules/customer-service/customer-service.controller'
import { ServiceController } from '../modules/service/service.controller'
import { AuthController } from '../modules/auth/auth.controller'
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema, RefreshTokenSchema } from '../modules/auth/dto/auth.request'
import { authMiddleware } from '../core/middlewares/auth.middleware'
import { ProfileController } from '../modules/profile/profile.controller'
import { UpdateAccountSchema, UpdateBankSchema, UpdatePasswordSchema, UpdatePreferenceSchema } from '../modules/profile/dto/profile.request'
import { PointController } from '../modules/point/point.controller'

const routes = new Hono()
const customerController = new CustomerController()
const customerServiceController = new CustomerServiceController()
const serviceController = new ServiceController()
const authController = new AuthController()
const profileController = new ProfileController()
const pointController = new PointController()

const validationHook = (result: any, c: any) => {
    if (!result.success) {
        return ApiResponse.error(c, "Validation failed", 422, result.error.format())
    }
}

// Auth Routes
routes.post('/auth/register', zValidator('json', RegisterSchema, validationHook), (c) => authController.register(c))
routes.post('/auth/login', zValidator('json', LoginSchema, validationHook), (c) => authController.login(c))
routes.post('/auth/forgot-password', zValidator('json', ForgotPasswordSchema, validationHook), (c) => authController.forgotPassword(c))
routes.get('/auth/validate-reset-token', (c) => authController.validateResetToken(c))
routes.post('/auth/reset-password', zValidator('json', ResetPasswordSchema, validationHook), (c) => authController.resetPassword(c))
routes.post('/auth/refresh', zValidator('json', RefreshTokenSchema, validationHook), (c) => authController.refreshToken(c))
routes.get('/auth/me', authMiddleware, (c) => authController.me(c))
routes.post('/auth/logout', authMiddleware, (c) => authController.logout(c))

// Profile Routes
routes.get('/profile', authMiddleware, (c) => profileController.show(c))
routes.put('/profile/account', authMiddleware, zValidator('json', UpdateAccountSchema, validationHook), (c) => profileController.updateAccount(c))
routes.put('/profile/bank', authMiddleware, zValidator('json', UpdateBankSchema, validationHook), (c) => profileController.updateBank(c))
routes.put('/profile/preference', authMiddleware, zValidator('json', UpdatePreferenceSchema, validationHook), (c) => profileController.updatePreference(c))
routes.put('/profile/password', authMiddleware, zValidator('json', UpdatePasswordSchema, validationHook), (c) => profileController.updatePassword(c))

// Point Routes
routes.get('/point', authMiddleware, (c) => pointController.show(c))

// Customer Routes
routes.get('/customer', authMiddleware, (c) => customerController.index(c))
routes.get('/customer/:id', authMiddleware, (c) => customerController.show(c))
routes.get('/customer/:id/address', authMiddleware, (c) => customerController.addresses(c))
routes.get('/customer/:id/service', authMiddleware, (c) => customerServiceController.index(c))

// Service Routes
routes.get('/service', authMiddleware, (c) => serviceController.index(c))
routes.get('/service/:code', authMiddleware, (c) => serviceController.show(c))

export default routes
