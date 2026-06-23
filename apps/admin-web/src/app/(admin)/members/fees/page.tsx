import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { GenerateFeesForm } from '@/components/members/GenerateFeesForm'
import { formatLKR } from '@masjidhub/utils'

export default async function FeesPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string; masjid_id?: string }
}) {
  const supabase = await createClient()
  const now = new Date()
  const year  = Number(searchParams.year  ?? now.getFullYear())
  const month = Number(searchParams.month ?? now.getMonth() + 1)

  const [{ data: masjids }, { data: fees }] = await Promise.all([
    supabase.from('masjids').select('id, name').eq('status', 'active'),
    supabase
      .from('member_monthly_fees')
      .select('*, members(full_name, area, member_code)')
      .eq('year', year)
      .eq('month', month)
      .order('status'),
  ])

  const total     = fees?.reduce((s, f) => s + f.amount_due, 0) ?? 0
  const collected = fees?.reduce((s, f) => s + f.amount_paid, 0) ?? 0
  const unpaid    = fees?.filter(f => ['unpaid','overdue','partially_paid'].includes(f.status)).length ?? 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Link href="/members" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Members</Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>Monthly Fees</h1>
        </div>
        <GenerateFeesForm masjids={masjids ?? []} year={year} month={month} />
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Members', value: fees?.length ?? 0, color: 'var(--color-deep-teal)' },
          { label: 'Expected (LKR)', value: formatLKR(total), color: 'var(--color-primary-green)' },
          { label: 'Collected (LKR)', value: formatLKR(collected), color: 'var(--color-success)' },
          { label: 'Unpaid', value: unpaid, color: 'var(--color-danger)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `4px solid ${c.color}` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--color-light-cream)' }}>
              {['Code','Member','Area','Due (LKR)','Paid (LKR)','Balance','Status'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(fees ?? []).map((f, i) => {
              const member = f.members as { full_name: string; area: string; member_code: string } | null
              const balance = f.amount_due - f.amount_paid
              return (
                <tr key={f.id} style={{ borderTop: i > 0 ? '1px solid var(--color-neutral-light)' : undefined }}>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-secondary)' }}>{member?.member_code}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{member?.full_name}</td>
                  <td style={{ padding: '10px 16px' }}>{member?.area}</td>
                  <td style={{ padding: '10px 16px' }}>{formatLKR(f.amount_due)}</td>
                  <td style={{ padding: '10px 16px' }}>{formatLKR(f.amount_paid)}</td>
                  <td style={{ padding: '10px 16px', color: balance > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                    {formatLKR(balance)}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <FeeStatusBadge status={f.status} />
                  </td>
                </tr>
              )
            })}
            {!fees?.length && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No fees generated for this month yet. Use the Generate button above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FeeStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    paid:           { bg: '#dcfce7', text: '#166534' },
    unpaid:         { bg: '#fee2e2', text: '#991b1b' },
    overdue:        { bg: '#fef2f2', text: '#b91c1c' },
    partially_paid: { bg: '#fef3c7', text: '#92400e' },
    waived:         { bg: '#f3f4f6', text: '#6b7280' },
    sponsored:      { bg: '#e0f2fe', text: '#0369a1' },
  }
  const c = map[status] ?? { bg: '#f3f4f6', text: '#374151' }
  return (
    <span style={{ background: c.bg, color: c.text, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {status.replace('_', ' ')}
    </span>
  )
}
