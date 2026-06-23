import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatLKR } from '@masjidhub/utils'
import { MONTH_NAMES } from '@masjidhub/config'
import { recordSalaryPayment } from '../../actions'

export default async function PaySalaryPage({
  params,
  searchParams,
}: {
  params: { staffId: string }
  searchParams: { year?: string; month?: string }
}) {
  const supabase = await createClient()
  const now   = new Date()
  const year  = Number(searchParams.year  ?? now.getFullYear())
  const month = Number(searchParams.month ?? now.getMonth() + 1)

  const [{ data: staffMember }, { data: masjids }, { data: funds }] = await Promise.all([
    supabase.from('staff').select('*').eq('id', params.staffId).single(),
    supabase.from('masjids').select('id, name').eq('status', 'active'),
    supabase.from('funds').select('id, name, masjid_id').eq('status', 'active'),
  ])

  if (!staffMember) notFound()

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/salaries" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Salaries</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 4px' }}>Pay Salary</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: 14 }}>
        {staffMember.full_name} · {monthLabel}
      </p>

      <form action={recordSalaryPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="hidden" name="staff_id"  value={params.staffId} />
        <input type="hidden" name="masjid_id" value={staffMember.masjid_id} />
        <input type="hidden" name="year"      value={year} />
        <input type="hidden" name="month"     value={month} />

        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14, color: 'var(--color-deep-teal)' }}>Salary Breakdown</div>
          <div style={grid2}>
            <Field label="Basic Salary (LKR) *">
              <input name="basic_salary" type="number" min={0} step={100} required style={inp} defaultValue={staffMember.salary_amount} />
            </Field>
            <Field label="Allowance (LKR)">
              <input name="allowance" type="number" min={0} step={100} style={inp} defaultValue={0} />
            </Field>
            <Field label="Advance Deduction (LKR)">
              <input name="advance_deduction" type="number" min={0} step={100} style={inp} defaultValue={0} />
            </Field>
            <Field label="Bonus (LKR)">
              <input name="bonus" type="number" min={0} step={100} style={inp} defaultValue={0} />
            </Field>
          </div>

          {/* Net paid preview */}
          <div style={{ background: 'var(--color-light-cream)', borderRadius: 8, padding: '12px 16px', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Net Paid</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary-green)' }}>
              {formatLKR(staffMember.salary_amount)}
            </span>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14, color: 'var(--color-deep-teal)' }}>Payment Details</div>
          <div style={grid2}>
            <Field label="Fund *">
              <select name="fund_id" required style={inp}>
                <option value="">Select fund…</option>
                {(funds ?? []).filter(f => f.masjid_id === staffMember.masjid_id).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment Method">
              <select name="method" style={inp}>
                <option value="">—</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </Field>
            <Field label="Paid Date *">
              <input name="paid_date" type="date" required style={inp} defaultValue={new Date().toISOString().split('T')[0]} />
            </Field>
          </div>
          <Field label="Notes" style={{ marginTop: 10 }}>
            <input name="notes" style={inp} placeholder="Optional" />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" style={submitBtn}>Mark as Paid</button>
          <Link href="/salaries" style={cancelBtn}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const inp: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 12px', fontSize: 14, width: '100%', background: 'white' }
const submitBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: 'white', color: 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '12px 24px', fontSize: 15, textDecoration: 'none', display: 'inline-block' }
