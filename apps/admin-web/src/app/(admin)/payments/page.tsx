import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, formatLKR } from '@masjidhub/utils'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string; method?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from('payments')
    .select('*, members(full_name, member_code), funds(name), receipts(receipt_number)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.method) query = query.eq('method', searchParams.method)

  const { data: payments } = await query

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Payments</h1>
        <Link href="/payments/collect" style={actionBtn}>+ Record Payment</Link>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'All',           href: '/payments' },
          { label: 'Approved',      href: '/payments?status=approved' },
          { label: 'Pending',       href: '/payments?status=pending' },
          { label: 'Rejected',      href: '/payments?status=rejected' },
          { label: 'Cash',          href: '/payments?method=cash' },
          { label: 'Bank Transfer', href: '/payments?method=bank_transfer' },
        ].map(f => (
          <Link key={f.href} href={f.href} style={filterChip}>{f.label}</Link>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--color-light-cream)' }}>
              {['Date','Member','Fund','Amount','Method','Status','Receipt','Action'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).map((p, i) => {
              const member  = p.members  as { full_name: string; member_code: string } | null
              const fund    = p.funds    as { name: string } | null
              const receipt = p.receipts as { receipt_number: string } | null
              return (
                <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--color-neutral-light)' : undefined }}>
                  <td style={td}>{formatDate(p.payment_date)}</td>
                  <td style={td}>
                    <div style={{ fontWeight: 500 }}>{member?.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{member?.member_code}</div>
                  </td>
                  <td style={td}>{fund?.name ?? '—'}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{formatLKR(p.amount)}</td>
                  <td style={td}><MethodBadge method={p.method} /></td>
                  <td style={td}><StatusBadge status={p.status} /></td>
                  <td style={td}>
                    {receipt ? (
                      <Link href={`/payments/receipt/${p.receipt_id}`} style={{ color: 'var(--color-primary-green)', fontSize: 12, fontWeight: 600 }}>
                        {receipt.receipt_number}
                      </Link>
                    ) : '—'}
                  </td>
                  <td style={td}>
                    {p.status === 'pending' && (
                      <Link href={`/slips/${p.id}`} style={{ fontSize: 12, background: 'var(--color-warning)', color: 'white', padding: '4px 10px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>
                        Review
                      </Link>
                    )}
                  </td>
                </tr>
              )
            })}
            {!payments?.length && (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No payments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const td: React.CSSProperties = { padding: '12px 16px' }
const actionBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }
const filterChip: React.CSSProperties = { padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'white', border: '1px solid var(--color-neutral-light)', textDecoration: 'none', color: 'var(--color-text-primary)' }

function MethodBadge({ method }: { method: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    cash:          { bg: '#dcfce7', text: '#166534', label: 'Cash' },
    bank_transfer: { bg: '#e0f2fe', text: '#0369a1', label: 'Bank' },
    cheque:        { bg: '#fef3c7', text: '#92400e', label: 'Cheque' },
    other:         { bg: '#f3f4f6', text: '#6b7280', label: 'Other' },
  }
  const c = map[method] ?? map.other!
  return <span style={{ background: c.bg, color: c.text, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{c.label}</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    approved: { bg: '#dcfce7', text: '#166534' },
    pending:  { bg: '#fef3c7', text: '#92400e' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
    voided:   { bg: '#f3f4f6', text: '#6b7280' },
  }
  const c = map[status] ?? { bg: '#f3f4f6', text: '#374151' }
  return <span style={{ background: c.bg, color: c.text, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{status}</span>
}
