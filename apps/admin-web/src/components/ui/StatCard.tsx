interface StatCardProps {
  label: string
  value: number | string
  color?: string
}

export function StatCard({ label, value, color = 'var(--color-primary-green)' }: StatCardProps) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{label}</div>
    </div>
  )
}
