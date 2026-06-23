'use client'

import { useState, useTransition } from 'react'
import { approvePayment, rejectPayment } from '@/app/(admin)/payments/actions'
import { MONTH_NAMES } from '@masjidhub/config'
import { formatLKR } from '@masjidhub/utils'

interface UnpaidMonth { year: number; month: number; amount_due: number; amount_paid: number; status: string }

interface Props {
  paymentId: string
  unpaidMonths: UnpaidMonth[]
  paymentAmount: number
}

export function SlipReviewForm({ paymentId, unpaidMonths, paymentAmount }: Props) {
  const [pending, startTransition] = useTransition()
  const [tab, setTab]               = useState<'approve' | 'reject'>('approve')
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [rejReason, setRejReason]   = useState('amount_mismatch')
  const [rejNotes, setRejNotes]     = useState('')
  const [done, setDone]             = useState(false)

  function toggleMonth(ym: string) {
    setSelectedMonths(prev => prev.includes(ym) ? prev.filter(x => x !== ym) : [...prev, ym])
  }

  function handleApprove() {
    startTransition(async () => {
      await approvePayment(paymentId, selectedMonths)
      setDone(true)
    })
  }

  function handleReject() {
    if (!rejNotes.trim() && rejReason === 'other') return
    startTransition(async () => {
      await rejectPayment(paymentId, rejReason, rejNotes)
      setDone(true)
    })
  }

  if (done) {
    return (
      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: tab === 'approve' ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {tab === 'approve' ? '✓ Payment Approved & Receipt Generated' : '✗ Payment Rejected'}
        </div>
        <a href="/slips" style={{ display: 'inline-block', marginTop: 16, color: 'var(--color-primary-green)', fontSize: 14 }}>← Back to Slips</a>
      </div>
    )
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => setTab('approve')}
          style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            background: tab === 'approve' ? 'var(--color-primary-green)' : 'var(--color-light-cream)',
            color: tab === 'approve' ? 'white' : 'var(--color-text-secondary)' }}>
          Approve
        </button>
        <button type="button" onClick={() => setTab('reject')}
          style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            background: tab === 'reject' ? 'var(--color-danger)' : 'var(--color-light-cream)',
            color: tab === 'reject' ? 'white' : 'var(--color-text-secondary)' }}>
          Reject
        </button>
      </div>

      {tab === 'approve' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {unpaidMonths.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Select months to mark as paid (payment: {formatLKR(paymentAmount)})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {unpaidMonths.map(f => {
                  const ym = `${f.year}-${String(f.month).padStart(2, '0')}`
                  const selected = selectedMonths.includes(ym)
                  return (
                    <button key={ym} type="button" onClick={() => toggleMonth(ym)}
                      style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                        border: selected ? '2px solid var(--color-primary-green)' : '1px solid var(--color-neutral-light)',
                        background: selected ? '#dcfce7' : 'white', fontWeight: selected ? 600 : 400 }}>
                      {MONTH_NAMES[f.month - 1]!.slice(0,3)} {f.year}
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--color-danger)' }}>
                        {formatLKR(f.amount_due - f.amount_paid)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <button type="button" onClick={handleApprove} disabled={pending}
            style={{ background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {pending ? 'Approving…' : 'Approve & Generate Receipt'}
          </button>
        </div>
      )}

      {tab === 'reject' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Rejection Reason *</label>
            <select value={rejReason} onChange={e => setRejReason(e.target.value)}
              style={{ width: '100%', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 12px', fontSize: 14 }}>
              <option value="amount_mismatch">Amount mismatch</option>
              <option value="duplicate_slip">Duplicate slip</option>
              <option value="invalid_image">Invalid slip image</option>
              <option value="wrong_account">Wrong masjid account</option>
              <option value="not_found_in_bank">Payment not found in bank</option>
              <option value="other">Other reason</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Notes</label>
            <textarea value={rejNotes} onChange={e => setRejNotes(e.target.value)}
              placeholder="Explain the issue to the member…"
              style={{ width: '100%', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 12px', fontSize: 14, height: 80, resize: 'vertical' }} />
          </div>
          <button type="button" onClick={handleReject} disabled={pending}
            style={{ background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {pending ? 'Rejecting…' : 'Reject Payment'}
          </button>
        </div>
      )}
    </div>
  )
}
