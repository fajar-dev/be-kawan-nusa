import { Context } from "hono"
import { NotificationService } from "./notification.service"
import { ApiResponse } from "../../core/helpers/response"
import { NotificationSerializer } from "./serializers/notification.serialize"

export class NotificationController {
    constructor(private readonly service: NotificationService) {}

    async index(c: Context) {
        const user = c.get("user")
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10

        const { data, readIds, total } = await this.service.getForUser(user.id, page, limit)
        return ApiResponse.paginate(c, NotificationSerializer.collection(data, readIds), total, page, limit, "Notifications retrieved successfully")
    }

    async unreadCount(c: Context) {
        const user = c.get("user")
        const count = await this.service.getUnreadCount(user.id)
        return ApiResponse.success(c, { count }, "Unread count retrieved successfully")
    }

    async markRead(c: Context) {
        const user = c.get("user")
        const id = Number(c.req.param("id"))
        await this.service.markRead(user.id, id)
        return ApiResponse.success(c, null, "Notification marked as read")
    }

    async markAllRead(c: Context) {
        const user = c.get("user")
        const affected = await this.service.markAllRead(user.id)
        return ApiResponse.success(c, { marked: affected }, "All notifications marked as read")
    }
}
