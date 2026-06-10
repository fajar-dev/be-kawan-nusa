export class UserListSerializer {
    static single(row: any) {
        return {
            id: row.id,
            name: row.name,
            photo: row.photo || null,
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

    static collection(rows: any[]) {
        return rows.map(row => this.single(row))
    }
}
