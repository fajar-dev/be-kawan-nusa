import { NotificationRepository } from "./repositories/notification.repository"
import { NotificationService } from "./notification.service"
import { NotificationController } from "./notification.controller"

const repository = new NotificationRepository()

// Exported for other modules/jobs to raise notifications (notifyUser / notifyBroadcast).
export const notificationService = new NotificationService(repository)
export const notificationController = new NotificationController(notificationService)
