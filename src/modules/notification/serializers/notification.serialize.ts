import { Notification } from "../entities/notification.entity"

export class NotificationSerializer {
    static single(item: Notification, readIds: Set<number>) {
        return {
            id: item.id,
            type: item.type,
            title: item.title,
            message: item.message,
            link: item.link,
            referenceId: item.referenceId,
            isBroadcast: item.userId === null,
            isRead: readIds.has(item.id),
            createdAt: item.createdAt,
        }
    }

    static collection(data: Notification[], readIds: Set<number>) {
        return data.map(item => this.single(item, readIds))
    }
}
