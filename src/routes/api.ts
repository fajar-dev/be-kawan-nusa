import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ApiResponse } from '../core/helpers/apiResponse'
import { CustomerController } from '../modules/customer/customer.controller'
import { ServiceController } from '../modules/service/service.controller'
import { CreateServiceSchema, UpdateServiceSchema } from '../modules/service/dto/service.request'
import { AuthController } from '../modules/auth/auth.controller'
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema, RefreshTokenSchema } from '../modules/auth/dto/auth.request'
import { authMiddleware } from '../core/middlewares/auth.middleware'
import { ProfileController } from '../modules/profile/profile.controller'
import { UpdateAccountSchema, UpdateBankSchema, UpdatePasswordSchema, UpdatePreferenceSchema } from '../modules/profile/dto/profile.request'

const routes = new Hono()
const customerController = new CustomerController()
const serviceController = new ServiceController()
const authController = new AuthController()
const profileController = new ProfileController()

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

// Customer Routes
routes.get('/customer', authMiddleware, (c) => customerController.index(c))
routes.get('/customer/:id', authMiddleware, (c) => customerController.show(c))

// Service Routes
routes.get('/service', (c) => serviceController.index(c))
routes.get('/service/:id', (c) => serviceController.show(c))
routes.post('/service', zValidator('json', CreateServiceSchema, validationHook), (c) => serviceController.store(c))
routes.patch('/service/:id', zValidator('json', UpdateServiceSchema, validationHook), (c) => serviceController.update(c))
routes.delete('/service/:id', (c) => serviceController.destroy(c))

export default routes
