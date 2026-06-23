import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLKR } from '@masjidhub/utils'

export default async function UnpaidMembersPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string }
}) {
  const supabase = await createClient()
  const now   = new Date()
  const year  = Number(searchParams.year  ?? now.getFullYear())
  const month = Number(searchParams.month ?? now.getMonth() + 1)

  const { data: unpaid } = await supabase
    .from('member_monthly_fees')
    .select('*, members(id, full_name, area, phone, member_code, collector_id)')
    .eq('year', year)
    .eq('month', month)
    .in('status', ['unpaid', 'overdue', 'partially_paid'])
    .order('status')

  const totalOutstanding = (unpaid ?? []).reduce(
    (sum, f) => sum + (f.amount_due - f.amount_paid), 0
  )

  const monthLabel = new Date(year, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Link href="/members/fees" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Monthly Fees</Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>Unpaid Members — {monthLabel}</h1>
        </div>
        <MonthPicker year={year} month={month} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        <SummaryCard label="Unpaid / Overdue" value={(unpaid ?? []).length} color="var(--color-danger)" />
        <SummaryCard label="Partially Paid"   value={(unpaid ?? []).filter(f => f.status === 'partially_paid').length} color="var(--color-warning)" />
        <SummaryCard label="Total Outstanding (LKR)" value={formatLKR(totalOutstanding)} color="var(--color-deep-teal)" />
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--color-light-cream)' }}>
              {['Code','Member','Area','Phone','Due','Paid','Outstanding','Status','Action'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(unpaid ?? []).map((f, i) => {
              const m = f.members as { id: string; full_name: string; area: string; phone: string; member_code: string } | null
              const outstanding = f.amount_due - f.amount_paid
              return (
                <tr key={f.id} style={{ borderTop: i > 0 ? '1px solid var(--color-neutral-light)' : undefined }}>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-secondary)' }}>{m?.member_code}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <Link href={`/members/${m?.id}`} style={{ color: 'var(--color-primary-green)', fontWeight: 500, textDecoration: 'none' }}>
                      {m?.full_name}
                    </Link>
                  </td>
                  <td style={{ padding: '10px 16px' }}>{m?.area}</td>
                  <td style={{ padding: '10px 16px' }}>{m?.phone ?? '—'}</td>
                  <td style={{ padding: '10px 16px' }}>{formatLKR(f.amount_due)}</td>
                  <td style={{ padding: '10px 16px' }}>{formatLKR(f.amount_paid)}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--color-danger)' }}>
                    {formatLKR(outstanding)}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <StatusBadge status={f.status} />
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Link
                      href={`/payments/collect?member_id=${m?.id}&year=${year}&month=${month}`}
                      style={{ fontSize: 12, background: 'var(--color-primary-green)', color: 'white', padding: '4px 12px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}
                    >
                      Collect
                    </Link>
                  </td>
                </tr>
              )
            })}
            {!unpaid?.length && (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--color-success)', fontWeight: 600 }}>
                  All members paid for {monthLabel}! 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MonthPicker({ year, month }: { year: number; month: number }) {
  const prev = month === 1  ? `?year=${year - 1}&month=12` : `?year=${year}&month=${month - 1}`
  const next = month === 12 ? `?year=${year + 1}&month=1`  : `?year=${year}&month=${month + 1}`
  const label = new Date(year, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Link href={prev} style={navBtn}>‹</Link>
      <span style={{ fontWeight: 600, minWidth: 130, textAlign: 'center' }}>{label}</span>
      <Link href={next} style={navBtn}>›</Link>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'white',
  border: '1px solid var(--color-neutral-light)',
  borderRadius: 8,
  padding: '6px 14px',
  textDecoration: 'none',
  color: 'var(--color-text-primary)',
  fontWeight: 700,
  fontSize: 16,
}

function SummaryCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    unpaid:         { bg: '#fee2e2', text: '#991b1b' },
    overdue:        { bg: '#fef2f2', text: '#b91c1c' },
    partially_paid: { bg: '#fef3c7', text: '#92400e' },
  }
  const c = map[status] ?? { bg: '#f3f4f6', text: '#374151' }
  return (
    <span style={{ background: c.bg, color: c.text, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {status.replace('_', ' ')}
    </span>
  )
}
