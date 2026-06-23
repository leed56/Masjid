'use client'

import { useState, useTransition, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MONTH_NAMES } from '@masjidhub/config'
import { formatLKR } from '@masjidhub/utils'

interface UnpaidMonth { year: number; month: number; amount_due: number; amount_paid: number }

interface Props {
  action: (fd: FormData) => Promise<void>
  members: { id: string; full_name: string; member_code: string; area: string; monthly_fee_amount: number; masjid_id: string }[]
  funds: { id: string; name: string; type: string; masjid_id: string }[]
  masjids: { id: string; name: string }[]
  preselectedMemberId?: string
  preselectedYear?: number
  preselectedMonth?: number
  initialUnpaidMonths: UnpaidMonth[]
}

export function CollectForm({ action, members, funds, masjids, preselectedMemberId, preselectedYear, preselectedMonth, initialUnpaidMonths }: Props) {
  const [pending, startTransition] = useTransition()
  const [memberId, setMemberId]     = useState(preselectedMemberId ?? '')
  const [masjidId, setMasjidId]     = useState(masjids[0]?.id ?? '')
  const [amount, setAmount]         = useState('')
  const [unpaidMonths, setUnpaidMonths] = useState<UnpaidMonth[]>(initialUnpaidMonths)
  const [selectedMonths, setSelectedMonths] = useState<string[]>(
    preselectedYear && preselectedMonth ? [`${preselectedYear}-${String(preselectedMonth).padStart(2,'0')}`] : []
  )
  const supabase = createClient()

  const selectedMember = members.find(m => m.id === memberId)
  const masjidFunds = funds.filter(f => f.masjid_id === masjidId)
  const monthlyFund = masjidFunds.find(f => f.type === 'monthly_fee') ?? masjidFunds[0]

  // Load unpaid months when member changes
  useEffect(() => {
    if (!memberId) { setUnpaidMonths([]); return }
    supabase
      .from('member_monthly_fees')
      .select('year, month, amount_due, amount_paid')
      .eq('member_id', memberId)
      .in('status', ['unpaid', 'overdue', 'partially_paid'])
      .order('year').order('month')
      .then(({ data }) => setUnpaidMonths(data ?? []))
  }, [memberId])

  // Auto-calculate amount from selected months
  useEffect(() => {
    if (!selectedMonths.length || !unpaidMonths.length) return
    const total = selectedMonths.reduce((sum, ym) => {
      const [y, m] = ym.split('-').map(Number)
      const fee = unpaidMonths.find(f => f.year === y && f.month === m)
      return sum + (fee ? fee.amount_due - fee.amount_paid : 0)
    }, 0)
    if (total > 0) setAmount(String(total))
  }, [selectedMonths])

  function toggleMonth(ym: string) {
    setSelectedMonths(prev =>
      prev.includes(ym) ? prev.filter(x => x !== ym) : [...prev, ym]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    selectedMonths.forEach(m => fd.append('months[]', m))
    startTransition(() => action(fd))
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Masjid & Member">
        <Field label="Masjid *">
          <select name="masjid_id" required style={inp} value={masjidId} onChange={e => setMasjidId(e.target.value)}>
            {masjids.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Member *">
          <select name="member_id" required style={inp} value={memberId} onChange={e => setMemberId(e.target.value)}>
            <option value="">Select member…</option>
            {members.filter(m => m.masjid_id === masjidId).map(m => (
              <option key={m.id} value={m.id}>{m.full_name} ({m.member_code}) — {m.area}</option>
            ))}
          </select>
        </Field>
        {selectedMember && (
          <div style={{ background: 'var(--color-light-cream)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
            Monthly fee: <strong>{formatLKR(selectedMember.monthly_fee_amount)}</strong>
          </div>
        )}
      </Card>

      {unpaidMonths.length > 0 && (
        <Card title="Select Months to Mark as Paid">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {unpaidMonths.map(f => {
              const ym = `${f.year}-${String(f.month).padStart(2, '0')}`
              const selected = selectedMonths.includes(ym)
              const balance  = f.amount_due - f.amount_paid
              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => toggleMonth(ym)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: selected ? '2px solid var(--color-primary-green)' : '1px solid var(--color-neutral-light)',
                    background: selected ? '#dcfce7' : 'white',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {MONTH_NAMES[f.month - 1]} {f.year}
                  <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{formatLKR(balance)}</div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      <Card title="Payment Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Amount (LKR) *">
            <input name="amount" type="number" min={1} step={50} required style={inp} value={amount} onChange={e => setAmount(e.target.value)} />
          </Field>
          <Field label="Date *">
            <input name="payment_date" type="date" required style={inp} defaultValue={new Date().toISOString().split('T')[0]} />
          </Field>
          <Field label="Fund *">
            <select name="fund_id" required style={inp} defaultValue={monthlyFund?.id ?? ''}>
              {masjidFunds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <input name="notes" style={inp} placeholder="Optional" />
          </Field>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" disabled={pending} style={submitBtn}>
          {pending ? 'Saving…' : 'Record & Generate Receipt'}
        </button>
        <a href="/payments" style={cancelBtn}>Cancel</a>
      </div>
    </form>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14, color: 'var(--color-deep-teal)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 12px', fontSize: 14, width: '100%', background: 'white' }
const submitBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: 'white', color: 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '12px 24px', fontSize: 15, textDecoration: 'none', display: 'inline-block' }
