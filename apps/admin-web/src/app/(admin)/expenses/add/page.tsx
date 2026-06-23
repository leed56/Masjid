import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createExpense } from '../actions'

const CATEGORIES = [
  ['head_moulavi_salary',      'Head Moulavi Salary'],
  ['muazzin_salary',           'Muazzin Salary'],
  ['assistant_moulavi_salary', 'Asst. Moulavi Salary'],
  ['madarsa_teacher_salary',   'Madarsa Teacher Salary'],
  ['cleaner_salary',           'Cleaner Salary'],
  ['security_salary',          'Security Salary'],
  ['electricity',              'Electricity'],
  ['water',                    'Water'],
  ['internet',                 'Internet'],
  ['sound_system',             'Sound System'],
  ['carpet',                   'Carpet'],
  ['ac_fan_repair',            'AC/Fan Repair'],
  ['building_maintenance',     'Building Maintenance'],
  ['wudu_toilet_maintenance',  'Wudu/Toilet Maintenance'],
  ['ramadan_iftar',            'Ramadan Iftar'],
  ['taraweeh_program',         'Taraweeh Program'],
  ['jumma_guest_payment',      'Jumma Guest Payment'],
  ['janaza_support',           'Janaza Support'],
  ['printing_stationery',      'Printing/Stationery'],
  ['bank_charges',             'Bank Charges'],
  ['development_construction', 'Development/Construction'],
  ['other',                    'Other'],
]

export default async function AddExpensePage() {
  const supabase = await createClient()
  const [{ data: funds }, { data: masjids }] = await Promise.all([
    supabase.from('funds').select('id, name, type, masjid_id').eq('status', 'active'),
    supabase.from('masjids').select('id, name').eq('status', 'active'),
  ])

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/expenses" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Expenses</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 24px' }}>Add Expense</h1>

      <form action={createExpense} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Expense Details">
          <div style={grid2}>
            <Field label="Masjid *">
              <select name="masjid_id" required style={inp}>
                {(masjids ?? []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Fund *">
              <select name="fund_id" required style={inp}>
                <option value="">Select fund…</option>
                {(funds ?? []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
            <Field label="Category *">
              <select name="category" required style={inp}>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Amount (LKR) *">
              <input name="amount" type="number" min={1} step={50} required style={inp} />
            </Field>
            <Field label="Date *">
              <input name="expense_date" type="date" required style={inp} defaultValue={new Date().toISOString().split('T')[0]} />
            </Field>
            <Field label="Paid To">
              <input name="paid_to" style={inp} placeholder="Vendor / person name" />
            </Field>
            <Field label="Payment Method">
              <select name="method" style={inp}>
                <option value="">—</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </Field>
            <Field label="Status">
              <select name="status" style={inp}>
                <option value="pending">Pending approval</option>
                <option value="approved">Approve now</option>
              </select>
            </Field>
          </div>
          <Field label="Notes" style={{ marginTop: 8 }}>
            <textarea name="notes" style={{ ...inp, height: 70, resize: 'vertical' }} placeholder="Optional notes" />
          </Field>
        </Card>

        <Card title="Bill / Receipt Attachment">
          <Field label="Upload Bill (image or PDF)">
            <input name="bill" type="file" accept="image/*,.pdf" style={{ fontSize: 14 }} />
          </Field>
        </Card>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" style={submitBtn}>Save Expense</button>
          <Link href="/expenses" style={cancelBtn}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14, color: 'var(--color-deep-teal)' }}>{title}</div>
      {children}
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

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 8 }
const inp: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 12px', fontSize: 14, width: '100%', background: 'white' }
const submitBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: 'white', color: 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '12px 24px', fontSize: 15, textDecoration: 'none', display: 'inline-block' }
