export class WithdrawResource {
    static single(withdraw: any) {
        return {
            id: withdraw.id,
            userId: withdraw.userId,
            point: withdraw.point,
            bankName: withdraw.bankName,
            accountNumber: withdraw.accountNumber,
            accountHolderName: withdraw.accountHolderName,
            payout: withdraw.payout,
            tax: withdraw.tax,
            createdAt: withdraw.createdAt
        }
    }

    static collection(withdrawals: any[]) {
        return withdrawals.map(withdraw => this.single(withdraw))
    }
}
