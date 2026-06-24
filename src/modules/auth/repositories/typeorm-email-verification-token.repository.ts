import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { EmailVerificationToken } from "../entities/email-verification-token.entity"
import { IEmailVerificationTokenRepository } from "../interfaces/email-verification-token.repository.interface"

export class TypeOrmEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
    private readonly repository: Repository<EmailVerificationToken>

    constructor() {
        this.repository = AppDataSource.getRepository(EmailVerificationToken)
    }

    async create(userId: number, token: string, expiresAt: Date): Promise<EmailVerificationToken> {
        const verificationToken = this.repository.create({ userId, token, expiresAt })
        return await this.repository.save(verificationToken)
    }

    async findValidToken(token: string): Promise<EmailVerificationToken | null> {
        return await this.repository.createQueryBuilder("evt")
            .innerJoinAndSelect("evt.user", "user")
            .where("evt.token = :token", { token })
            .andWhere("evt.expires_at > :now", { now: new Date() })
            .getOne()
    }

    async deleteAllByUserId(userId: number): Promise<void> {
        await this.repository.delete({ userId })
    }
}
