import { In, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Notification } from "../entities/notification.entity"
import { NotificationRead } from "../entities/notification-read.entity"
import { INotificationRepository } from "../interfaces/notification.repository.interface"

export class NotificationRepository implements INotificationRepository {
    private readonly repo: Repository<Notification>
    private readonly readRepo: Repository<NotificationRead>

    constructor() {
        this.repo = AppDataSource.getRepository(Notification)
        this.readRepo = AppDataSource.getRepository(NotificationRead)
    }

    async findForUser(userId: number, page: number, limit: number): Promise<{ data: Notification[]; total: number }> {
        const [data, total] = await this.repo.createQueryBuilder("n")
            .where("(n.userId = :userId OR n.userId IS NULL)", { userId })
            .orderBy("n.createdAt", "DESC")
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()
        return { data, total }
    }

    async findReadIds(userId: number, notificationIds: number[]): Promise<Set<number>> {
        if (notificationIds.length === 0) return new Set()
        const rows = await this.readRepo.find({
            where: { userId, notificationId: In(notificationIds) },
            select: { notificationId: true },
        })
        return new Set(rows.map(r => r.notificationId))
    }

    async countUnread(userId: number): Promise<number> {
        return this.repo.createQueryBuilder("n")
            .where("(n.userId = :userId OR n.userId IS NULL)", { userId })
            .andWhere(qb => {
                const sub = qb.subQuery()
                    .select("1")
                    .from(NotificationRead, "nr")
                    .where("nr.notification_id = n.id")
                    .andWhere("nr.user_id = :userId")
                    .getQuery()
                return `NOT EXISTS ${sub}`
            })
            .getCount()
    }

    async findById(id: number): Promise<Notification | null> {
        return this.repo.findOneBy({ id })
    }

    async markRead(userId: number, notificationId: number): Promise<void> {
        // INSERT IGNORE — idempotent, safe on repeated clicks.
        await this.readRepo.createQueryBuilder()
            .insert()
            .into(NotificationRead)
            .values({ userId, notificationId })
            .orIgnore()
            .execute()
    }

    async markAllRead(userId: number): Promise<number> {
        const result = await this.readRepo.query(
            `INSERT IGNORE INTO notification_reads (notification_id, user_id)
             SELECT n.id, ? FROM notifications n
             WHERE (n.user_id = ? OR n.user_id IS NULL)
               AND NOT EXISTS (
                   SELECT 1 FROM notification_reads nr
                   WHERE nr.notification_id = n.id AND nr.user_id = ?
               )`,
            [userId, userId, userId]
        )
        return result?.affectedRows ?? 0
    }

    async create(data: Partial<Notification>): Promise<Notification> {
        return this.repo.save(this.repo.create(data))
    }
}
