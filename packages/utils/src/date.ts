export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function getMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1)
  )
}

export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
