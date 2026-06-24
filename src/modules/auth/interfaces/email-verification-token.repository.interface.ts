import { EmailVerificationToken } from "../entities/email-verification-token.entity"

export interface IEmailVerificationTokenRepository {
    create(userId: number, token: string, expiresAt: Date): Promise<EmailVerificationToken>
    findValidToken(token: string): Promise<EmailVerificationToken | null>
    deleteAllByUserId(userId: number): Promise<void>
}
