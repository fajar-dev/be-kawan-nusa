import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ApiResponse } from '../core/helpers/apiResponse'
import { CustomerController } from '../modules/customer/customer.controller'
import { CreateCustomerSchema, UpdateCustomerSchema } from '../modules/customer/customer.request'
import { ServiceController } from '../modules/service/service.controller'
import { CreateServiceSchema, UpdateServiceSchema } from '../modules/service/service.request'
import { UserController } from '../modules/user/user.controller'
import { CreateUserSchema, UpdateUserSchema } from '../modules/user/user.request'
import { AuthController } from '../modules/auth/auth.controller'
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema, RefreshTokenSchema } from '../modules/auth/auth.request'
import { authMiddleware } from '../core/middlewares/auth.middleware'

const routes = new Hono()
const customerController = new CustomerController()
const serviceController = new ServiceController()
const userController = new UserController()
const authController = new AuthController()

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

// Customer Routes
routes.get('/customer', (c) => customerController.index(c))
routes.get('/customer/:id', (c) => customerController.show(c))
routes.post('/customer', zValidator('json', CreateCustomerSchema, validationHook), (c) => customerController.store(c))
routes.patch('/customer/:id', zValidator('json', UpdateCustomerSchema, validationHook), (c) => customerController.update(c))
routes.delete('/customer/:id', (c) => customerController.destroy(c))

// Service Routes
routes.get('/service', (c) => serviceController.index(c))
routes.get('/service/:id', (c) => serviceController.show(c))
routes.post('/service', zValidator('json', CreateServiceSchema, validationHook), (c) => serviceController.store(c))
routes.patch('/service/:id', zValidator('json', UpdateServiceSchema, validationHook), (c) => serviceController.update(c))
routes.delete('/service/:id', (c) => serviceController.destroy(c))

// User Routes
routes.get('/user', (c) => userController.index(c))
routes.get('/user/:id', (c) => userController.show(c))
routes.post('/user', zValidator('json', CreateUserSchema, validationHook), (c) => userController.store(c))
routes.patch('/user/:id', zValidator('json', UpdateUserSchema, validationHook), (c) => userController.update(c))
routes.delete('/user/:id', (c) => userController.destroy(c))



export default routes
