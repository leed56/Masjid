export function formatLKR(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function calculateMonthsCovered(amount: number, monthlyFee: number): number {
  if (monthlyFee <= 0) return 0
  return Math.floor(amount / monthlyFee)
}

export function calculateBalance(paid: number, due: number): number {
  return paid - due
}
