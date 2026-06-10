import { minio } from "../../../core/helpers/minio"

export class UserListSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        return await minio.getPresignedUrl(photo)
    }

    static async single(row: any) {
        return {
            id: row.id,
            name: row.name,
            photo: await this.resolvePhotoUrl(row.photo),
            email: row.email || null,
            phone: row.phone || null,
            identityNumber: row.identityNumber ? Number(row.identityNumber) : null,
            taxNumber: row.taxNumber || null,
            bank: {
                holderName: row.accountHolderName || null,
                name: row.bankName || null,
                number: row.accountNumber || null,
            },
            isActive: Boolean(row.isActive),
            lastReferanceDate: row.lastReferanceDate || null,
            point: Number(row.point || 0),
        }
    }

    static async collection(rows: any[]) {
        return Promise.all(rows.map(row => this.single(row)))
    }
}
