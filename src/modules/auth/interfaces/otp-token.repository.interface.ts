import { OtpToken } from "../entities/otp-token.entity"

export interface IOtpTokenRepository {
    create(userId: number, code: string, expiresAt: Date): Promise<OtpToken>
    findValidToken(userId: number, code: string): Promise<OtpToken | null>
    deleteAllByUserId(userId: number): Promise<void>
}
