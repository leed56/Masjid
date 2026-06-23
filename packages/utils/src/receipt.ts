export function generateReceiptNumber(masjidCode: string, sequence: number): string {
  const year = new Date().getFullYear().toString().slice(-2)
  const seq = String(sequence).padStart(5, '0')
  return `${masjidCode.toUpperCase()}-${year}-${seq}`
}
