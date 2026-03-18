import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
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

// Customer Routes
routes.get('/customer', (c) => customerController.index(c))
routes.get('/customer/:id', (c) => customerController.show(c))
routes.post('/customer', zValidator('json', CreateCustomerSchema), (c) => customerController.store(c))
routes.patch('/customer/:id', zValidator('json', UpdateCustomerSchema), (c) => customerController.update(c))
routes.delete('/customer/:id', (c) => customerController.destroy(c))

// Service Routes
routes.get('/service', (c) => serviceController.index(c))
routes.get('/service/:id', (c) => serviceController.show(c))
routes.post('/service', zValidator('json', CreateServiceSchema), (c) => serviceController.store(c))
routes.patch('/service/:id', zValidator('json', UpdateServiceSchema), (c) => serviceController.update(c))
routes.delete('/service/:id', (c) => serviceController.destroy(c))

// User Routes
routes.get('/user', (c) => userController.index(c))
routes.get('/user/:id', (c) => userController.show(c))
routes.post('/user', zValidator('json', CreateUserSchema), (c) => userController.store(c))
routes.patch('/user/:id', zValidator('json', UpdateUserSchema), (c) => userController.update(c))
routes.delete('/user/:id', (c) => userController.destroy(c))

// Auth Routes
routes.post('/auth/register', zValidator('json', RegisterSchema), (c) => authController.register(c))
routes.post('/auth/login', zValidator('json', LoginSchema), (c) => authController.login(c))
routes.post('/auth/forgot-password', zValidator('json', ForgotPasswordSchema), (c) => authController.forgotPassword(c))
routes.post('/auth/reset-password', zValidator('json', ResetPasswordSchema), (c) => authController.resetPassword(c))
routes.post('/auth/refresh', zValidator('json', RefreshTokenSchema), (c) => authController.refreshToken(c))
routes.get('/auth/me', authMiddleware, (c) => authController.me(c))

export default routes
