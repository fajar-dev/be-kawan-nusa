export class UserListSerializer {
    static single(row: any) {
        return {
            id: row.id,
            name: row.name,
            photo: row.photo || null,
            email: row.email || null,
            identityNumber: row.identityNumber ? Number(row.identityNumber) : null,
            taxNumber: row.taxNumber || null,
            customerServicesCount: Number(row.customerServicesCount || 0),
            point: Number(row.point || 0),
        }
    }

    static collection(rows: any[]) {
        return rows.map(row => this.single(row))
    }
}
