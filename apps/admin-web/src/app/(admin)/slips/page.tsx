import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, formatLKR } from '@masjidhub/utils'

export default async function SlipsPage() {
  const supabase = await createClient()

  const { data: pending } = await supabase
    .from('payments')
    .select('*, members(full_name, member_code, area), funds(name)')
    .eq('status', 'pending')
    .not('slip_url', 'is', null)
    .order('created_at', { ascending: true })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Pending Payment Slips</h1>
        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
          {pending?.length ?? 0} pending
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(pending ?? []).map(p => {
          const member = p.members as { full_name: string; member_code: string; area: string } | null
          const fund   = p.funds   as { name: string } | null
          return (
            <div key={p.id} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 20 }}>
              {/* Slip thumbnail */}
              <div style={{ width: 120, flexShrink: 0 }}>
                {p.slip_url ? (
                  <a href={p.slip_url} target="_blank" rel="noreferrer">
                    <img src={p.slip_url} alt="slip" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-neutral-light)' }} />
                    <div style={{ fontSize: 11, color: 'var(--color-primary-green)', marginTop: 4, textAlign: 'center' }}>View full ↗</div>
                  </a>
                ) : (
                  <div style={{ width: 120, height: 90, background: 'var(--color-light-cream)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    No image
                  </div>
                )}
              </div>

              {/* Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{member?.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{member?.member_code} · {member?.area}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary-green)' }}>{formatLKR(p.amount)}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{fund?.name}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  Submitted: {formatDate(p.payment_date)}
                  {p.reference_no && <> · Ref: <strong>{p.reference_no}</strong></>}
                  {p.notes && <> · {p.notes}</>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/slips/${p.id}`}
                    style={{ background: 'var(--color-primary-green)', color: 'white', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
                  >
                    Review & Approve
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
        {!pending?.length && (
          <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--color-success)', fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            No pending slips — all caught up!
          </div>
        )}
      </div>
    </div>
  )
}
