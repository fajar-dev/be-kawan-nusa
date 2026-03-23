/**
 * Calculate withdrawal details
 * @param point Number of points to withdraw
 * @returns Object containing grossPayout, tax, and payout
 */
export const calculateWithdrawal = (point: number) => {
    const grossPayout = point * 1000
    const tax = grossPayout * (2.5 / 100)
    const payout = grossPayout - tax
    
    return { grossPayout, tax, payout }
}
