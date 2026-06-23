import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createStaff } from '../../actions'

export default async function AddStaffPage() {
  const supabase = await createClient()
  const { data: masjids } = await supabase.from('masjids').select('id, name').eq('status', 'active')

  return (
    <div style={{ maxWidth: 580 }}>
      <Link href="/salaries" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Salaries</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 24px' }}>Add Staff Member</h1>

      <form action={createStaff} style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={grid2}>
          <Field label="Masjid *">
            <select name="masjid_id" required style={inp}>
              {(masjids ?? []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Full Name *">
            <input name="full_name" required style={inp} />
          </Field>
          <Field label="Role *">
            <select name="role" required style={inp}>
              <option value="head_moulavi">Head Moulavi</option>
              <option value="muazzin">Muazzin</option>
              <option value="assistant_moulavi">Asst. Moulavi</option>
              <option value="madarsa_teacher">Madarsa Teacher</option>
              <option value="cleaner">Cleaner</option>
              <option value="security">Security</option>
              <option value="office_helper">Office Helper</option>
              <option value="ramadan_temp">Ramadan Temp</option>
              <option value="guest_speaker">Guest Speaker</option>
            </select>
          </Field>
          <Field label="Phone">
            <input name="phone" type="tel" style={inp} />
          </Field>
          <Field label="Start Date *">
            <input name="start_date" type="date" required style={inp} defaultValue={new Date().toISOString().split('T')[0]} />
          </Field>
          <Field label="Salary Amount (LKR) *">
            <input name="salary_amount" type="number" min={0} step={500} required style={inp} />
          </Field>
          <Field label="Salary Cycle *">
            <select name="salary_cycle" required style={inp}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="per_event">Per Event</option>
              <option value="per_class">Per Class</option>
            </select>
          </Field>
          <Field label="Address">
            <input name="address" style={inp} />
          </Field>
        </div>
        <Field label="Bank Details (optional)">
          <input name="bank_details" style={inp} placeholder="Bank / account number" />
        </Field>

        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button type="submit" style={submitBtn}>Add Staff</button>
          <Link href="/salaries" style={cancelBtn}>Cancel</Link>
        </div>
      </form>
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

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const inp: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 12px', fontSize: 14, width: '100%', background: 'white' }
const submitBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: 'white', color: 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '12px 24px', fontSize: 15, textDecoration: 'none', display: 'inline-block' }
