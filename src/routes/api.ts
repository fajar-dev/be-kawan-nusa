import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CustomerController } from '../modules/customer/customer.controller'
import { CreateCustomerSchema, UpdateCustomerSchema } from '../modules/customer/customer.request'
import { ServiceController } from '../modules/service/service.controller'
import { CreateServiceSchema, UpdateServiceSchema } from '../modules/service/service.request'

const routes = new Hono()
const customerController = new CustomerController()
const serviceController = new ServiceController()

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

export default routes
