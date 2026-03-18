import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ServiceController } from '../modules/service/service.controller'
import { CreateServiceSchema, UpdateServiceSchema } from '../modules/service/service.request'

const routes = new Hono()
const serviceController = new ServiceController()

// Service Routes
routes.get('/service', (c) => serviceController.index(c))
routes.get('/service/:id', (c) => serviceController.show(c))
routes.post('/service', zValidator('json', CreateServiceSchema), (c) => serviceController.store(c))
routes.patch('/service/:id', zValidator('json', UpdateServiceSchema), (c) => serviceController.update(c))
routes.delete('/service/:id', (c) => serviceController.destroy(c))

export default routes
