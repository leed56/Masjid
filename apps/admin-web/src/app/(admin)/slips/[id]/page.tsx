import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatLKR } from '@masjidhub/utils'
import { SlipReviewForm } from '@/components/payments/SlipReviewForm'

export default async function SlipReviewPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('*, members(id, full_name, member_code, area, monthly_fee_amount), funds(name)')
    .eq('id', params.id)
    .single()

  if (!payment) notFound()

  const member = payment.members as { id: string; full_name: string; member_code: string; area: string; monthly_fee_amount: number } | null

  // Load unpaid months for this member
  const { data: unpaidMonths } = await supabase
    .from('member_monthly_fees')
    .select('year, month, amount_due, amount_paid, status')
    .eq('member_id', member?.id ?? '')
    .in('status', ['unpaid', 'overdue', 'partially_paid'])
    .order('year').order('month')

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href="/slips" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Back to Slips</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 24px' }}>Review Slip</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left — slip image */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14, color: 'var(--color-deep-teal)' }}>Payment Slip</div>
          {payment.slip_url ? (
            <div>
              <img
                src={payment.slip_url}
                alt="Payment slip"
                style={{ width: '100%', borderRadius: 8, border: '1px solid var(--color-neutral-light)', maxHeight: 480, objectFit: 'contain' }}
              />
              <a href={payment.slip_url} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: 8, color: 'var(--color-primary-green)', fontSize: 13 }}>
                Open full size ↗
              </a>
            </div>
          ) : (
            <div style={{ height: 200, background: 'var(--color-light-cream)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
              No slip image uploaded
            </div>
          )}
        </div>

        {/* Right — payment details + approve/reject */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14, color: 'var(--color-deep-teal)' }}>Payment Info</div>
            {[
              { label: 'Member',     value: `${member?.full_name} (${member?.member_code})` },
              { label: 'Area',       value: member?.area ?? '—' },
              { label: 'Amount',     value: formatLKR(payment.amount) },
              { label: 'Date',       value: formatDate(payment.payment_date) },
              { label: 'Fund',       value: (payment.funds as { name: string } | null)?.name ?? '—' },
              { label: 'Reference',  value: payment.reference_no ?? '—' },
              { label: 'Notes',      value: payment.notes ?? '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 14, borderBottom: '1px solid var(--color-neutral-light)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                <span style={{ fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {payment.status === 'pending' ? (
            <SlipReviewForm
              paymentId={params.id}
              unpaidMonths={unpaidMonths ?? []}
              paymentAmount={payment.amount}
            />
          ) : (
            <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: payment.status === 'approved' ? 'var(--color-success)' : 'var(--color-danger)', marginBottom: 4 }}>
                {payment.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
              </div>
              {payment.rejection_reason && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{payment.rejection_reason}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
