import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { OtpToken } from "../entities/otp-token.entity"
import { IOtpTokenRepository } from "../interfaces/otp-token.repository.interface"

export class OtpTokenRepository implements IOtpTokenRepository {
    private readonly repository: Repository<OtpToken>

    constructor() {
        this.repository = AppDataSource.getRepository(OtpToken)
    }

    async create(userId: number, code: string, expiresAt: Date): Promise<OtpToken> {
        const otpToken = this.repository.create({ userId, code, expiresAt })
        return await this.repository.save(otpToken)
    }

    async findValidToken(userId: number, code: string): Promise<OtpToken | null> {
        return await this.repository.createQueryBuilder("otp")
            .innerJoinAndSelect("otp.user", "user")
            .where("otp.userId = :userId", { userId })
            .andWhere("otp.code = :code", { code })
            .andWhere("otp.expires_at > :now", { now: new Date() })
            .getOne()
    }

    async deleteAllByUserId(userId: number): Promise<void> {
        await this.repository.delete({ userId })
    }
}
