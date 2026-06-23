import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatLKR } from '@masjidhub/utils'
import type { Member, MemberMonthlyFee } from '@masjidhub/types'

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const [{ data: member }, { data: fees }] = await Promise.all([
    supabase.from('members').select('*').eq('id', params.id).single(),
    supabase
      .from('member_monthly_fees')
      .select('*')
      .eq('member_id', params.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(24),
  ])

  if (!member) notFound()

  const m = member as Member
  const feeRows = (fees ?? []) as MemberMonthlyFee[]
  const outstanding = feeRows
    .filter(f => ['unpaid', 'partially_paid', 'overdue'].includes(f.status))
    .reduce((sum, f) => sum + (f.amount_due - f.amount_paid), 0)

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Link href="/members" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Members</Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{m.full_name}</h1>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{m.member_code}</span>
        </div>
        <Link
          href={`/members/${m.id}/edit`}
          style={{ background: 'var(--color-primary-green)', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
        >
          Edit
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <InfoCard title="Contact">
          <Row label="Phone"    value={m.phone ?? '—'} />
          <Row label="WhatsApp" value={m.whatsapp ?? '—'} />
          <Row label="Email"    value={m.email ?? '—'} />
        </InfoCard>
        <InfoCard title="Location">
          <Row label="Address"  value={m.address} />
          <Row label="Area"     value={m.area} />
          <Row label="District" value={m.district ?? '—'} />
        </InfoCard>
        <InfoCard title="Fee Details">
          <Row label="Monthly Fee"  value={formatLKR(m.monthly_fee_amount)} />
          <Row label="Fee Category" value={m.fee_category} />
          <Row label="Outstanding"  value={formatLKR(outstanding)} highlight={outstanding > 0} />
        </InfoCard>
        <InfoCard title="Registration">
          <Row label="Status"    value={m.status} />
          <Row label="Joined"    value={formatDate(m.registered_date)} />
          <Row label="NIC"       value={m.nic ?? '—'} />
        </InfoCard>
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-neutral-light)', fontWeight: 600 }}>
          Fee History (last 24 months)
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--color-light-cream)' }}>
              {['Month','Due','Paid','Balance','Status'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {feeRows.map((f, i) => (
              <tr key={f.id} style={{ borderTop: i > 0 ? '1px solid var(--color-neutral-light)' : undefined }}>
                <td style={{ padding: '10px 16px' }}>{monthLabel(f.year, f.month)}</td>
                <td style={{ padding: '10px 16px' }}>{formatLKR(f.amount_due)}</td>
                <td style={{ padding: '10px 16px' }}>{formatLKR(f.amount_paid)}</td>
                <td style={{ padding: '10px 16px', color: f.amount_due > f.amount_paid ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {formatLKR(f.amount_due - f.amount_paid)}
                </td>
                <td style={{ padding: '10px 16px' }}><FeeStatusBadge status={f.status} /></td>
              </tr>
            ))}
            {feeRows.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No fee records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500, color: highlight ? 'var(--color-danger)' : undefined }}>{value}</span>
    </div>
  )
}

function FeeStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    paid:          { bg: '#dcfce7', text: '#166534' },
    unpaid:        { bg: '#fee2e2', text: '#991b1b' },
    overdue:       { bg: '#fef2f2', text: '#b91c1c' },
    partially_paid:{ bg: '#fef3c7', text: '#92400e' },
    waived:        { bg: '#f3f4f6', text: '#6b7280' },
    sponsored:     { bg: '#e0f2fe', text: '#0369a1' },
  }
  const c = map[status] ?? { bg: '#f3f4f6', text: '#374151' }
  return (
    <span style={{ background: c.bg, color: c.text, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {status.replace('_', ' ')}
    </span>
  )
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString('en', { month: 'short', year: 'numeric' })
}
