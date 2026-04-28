export enum RedemptionType {
    CASH = 'cash',
    VOUCHER = 'voucher',
    PRODUCT = 'product',
    EXPIRED = 'expired'
}

export enum RedemptionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired'
}

export enum Shipper {
    JNE = 'jne',
    JNT = 'jnt',
    SICEPAT = 'sicepat',
    NINJA = 'ninja',
    WAHANA = 'wahana',
    POS = 'pos',
    OTHERS = 'others'
}
