import { User } from "./entities/user.entity"
import { UserStatus } from "./user.enum"
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"
import { EntityManager } from "typeorm"
import { IUserRepository, UserListFilters } from "./interfaces/user.repository.interface"
import { mail } from "../../core/helpers/mail"
import { config } from "../../config/config"
import * as fs from "fs"
import * as path from "path"

export class UserService {
    constructor(private readonly repository: IUserRepository) {}

    async getAll(page: number, limit: number, q: string, sort: string, order: string, filters: UserListFilters = {}): Promise<{ data: any[]; total: number }> {
        return await this.repository.findAll(page, limit, q, sort, order, filters)
    }

    async getById(id: number): Promise<User> {
        const user = await this.repository.findById(id)
        if (!user) {
            throw new NotFoundException("User not found")
        }
        return user
    }

    async getByEmail(email: string): Promise<User | null> {
        return await this.repository.findByEmail(email)
    }

    async getByIdentifier(identifier: string): Promise<User | null> {
        return await this.repository.findByIdentifier(identifier)
    }

    async save(data: Partial<User>, manager?: EntityManager): Promise<User> {
        return await this.repository.save(data, manager)
    }

    async updateStatus(id: number, status: UserStatus, note: string): Promise<User> {
        const user = await this.repository.findById(id)
        if (!user) {
            throw new NotFoundException("User not found")
        }

        const allowedFromStatuses: (UserStatus | null)[] = [UserStatus.PENDING, UserStatus.REVISION, UserStatus.REJECT, null]
        if (!allowedFromStatuses.includes(user.status)) {
            throw new BadRequestException(`Cannot change status from '${user.status}'`)
        }

        user.status = status
        user.statusNote = note
        user.statusUpdatedAt = new Date()

        const saved = await this.repository.save(user)

        // Send status change email (fire-and-forget)
        this.sendStatusChangeEmail(saved, status, note).catch((err) =>
            console.error("[Email] Failed to send status change notification:", err)
        )

        return saved
    }

    private async sendStatusChangeEmail(user: User, status: UserStatus, note: string): Promise<void> {
        if (!user.email) return

        const templateMap: Record<string, { file: string; subject: string }> = {
            [UserStatus.ACTIVE]: { file: 'status-approved.html', subject: 'Pendaftaran Disetujui' },
            [UserStatus.REVISION]: { file: 'status-revision.html', subject: 'Pendaftaran Perlu Direvisi' },
            [UserStatus.REJECT]: { file: 'status-rejected.html', subject: 'Pendaftaran Ditolak' },
        }

        const template = templateMap[status]
        if (!template) return

        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User"
        const templatePath = path.join(process.cwd(), `public/templates/${template.file}`)
        const html = fs.readFileSync(templatePath, "utf8")
            .replace(/{{name}}/g, name)
            .replace(/{{note}}/g, note)
            .replace(/{{appUrl}}/g, config.app.appUrl)

        mail.sendHtml(user.email, `${template.subject} - Kawan Nusa`, html).catch((err) => {
            console.error(`[Mail] Failed to send status email to ${user.email}:`, err)
        })
    }
}

