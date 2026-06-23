import { createClient } from '@/lib/supabase/server'
import { formatLKR } from '@masjidhub/utils'
import { MONTH_NAMES } from '@masjidhub/config'
import { createClass, enrollStudent, generateMadarsaFees, recordMadarsaPayment } from './actions'

export default async function MadarsaPage({
  searchParams,
}: { searchParams: { masjid_id?: string; tab?: string; class_id?: string; year?: string; month?: string } }) {
  const supabase  = await createClient()
  const { data: masjids } = await supabase.from('masjids').select('id, name').eq('status', 'active')
  const { data: staffList } = await supabase.from('staff').select('id, full_name').in('role', ['madarsa_teacher'])

  const masjidId  = searchParams.masjid_id ?? masjids?.[0]?.id ?? ''
  const tab       = searchParams.tab ?? 'classes'
  const now       = new Date()
  const year      = Number(searchParams.year  ?? now.getFullYear())
  const month     = Number(searchParams.month ?? now.getMonth() + 1)

  const { data: classes } = await supabase
    .from('madarsa_classes')
    .select('*, staff(full_name)')
    .eq('masjid_id', masjidId)

  const classId = searchParams.class_id ?? classes?.[0]?.id ?? ''

  const { data: students } = classId
    ? await supabase.from('madarsa_students').select('*').eq('class_id', classId).eq('status', 'active').order('full_name')
    : { data: [] }

  const { data: fees } = await supabase
    .from('madarsa_fees')
    .select('*, madarsa_students(full_name, class_id)')
    .eq('masjid_id', masjidId)
    .eq('year', year)
    .eq('month', month)
    .order('status')

  const unpaidFees = (fees ?? []).filter(f => f.status !== 'paid' && f.status !== 'waived')
  const totalDue   = (fees ?? []).reduce((s, f) => s + f.amount_due, 0)
  const totalPaid  = (fees ?? []).reduce((s, f) => s + (f.amount_paid ?? 0), 0)

  const TABS = [
    { id: 'classes',  label: 'Classes & Students' },
    { id: 'fees',     label: 'Fee Collection' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Madarsa</h1>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TABS.map(t => (
          <a key={t.id} href={`/madarsa?tab=${t.id}&masjid_id=${masjidId}`}
            style={{ padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, textDecoration: 'none', background: tab === t.id ? 'var(--color-primary-green)' : 'white', color: tab === t.id ? 'white' : 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)' }}>
            {t.label}
          </a>
        ))}
      </div>

      {/* ── Classes & Students tab ── */}
      {tab === 'classes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Class selector */}
            {(classes ?? []).length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(classes ?? []).map(c => (
                  <a key={c.id} href={`/madarsa?tab=classes&masjid_id=${masjidId}&class_id=${c.id}`}
                    style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, textDecoration: 'none', background: classId === c.id ? 'var(--color-deep-teal)' : 'white', color: classId === c.id ? 'white' : 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)' }}>
                    {c.name}
                    {c.grade_level && <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>({c.grade_level})</span>}
                  </a>
                ))}
              </div>
            )}

            {/* Students table */}
            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-neutral-light)', fontWeight: 600, fontSize: 14, color: 'var(--color-deep-teal)' }}>
                {classes?.find(c => c.id === classId)?.name ?? 'Students'} — {(students ?? []).length} enrolled
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-neutral-light)' }}>
                    {['Name', 'DOB', 'Guardian', 'Phone', 'Enrolled'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(students ?? []).length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)' }}>No students enrolled.</td></tr>
                  )}
                  {(students ?? []).map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-neutral-light)' }}>
                      <td style={{ padding: '8px 14px', fontWeight: 500 }}>{s.full_name}</td>
                      <td style={{ padding: '8px 14px', color: 'var(--color-text-secondary)' }}>{s.date_of_birth ?? '—'}</td>
                      <td style={{ padding: '8px 14px' }}>{s.guardian_name ?? '—'}</td>
                      <td style={{ padding: '8px 14px', color: 'var(--color-text-secondary)' }}>{s.guardian_phone ?? '—'}</td>
                      <td style={{ padding: '8px 14px', color: 'var(--color-text-secondary)' }}>{s.enrolled_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enrol form */}
            {classId && (
              <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-deep-teal)', marginBottom: 12 }}>Enrol Student</div>
                <form action={enrollStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input type="hidden" name="masjid_id" value={masjidId} />
                  <input type="hidden" name="class_id"  value={classId} />
                  <Field label="Full Name *"><input name="full_name" required style={inp} /></Field>
                  <Field label="Date of Birth"><input name="date_of_birth" type="date" style={inp} /></Field>
                  <Field label="Guardian Name"><input name="guardian_name" style={inp} /></Field>
                  <Field label="Guardian Phone"><input name="guardian_phone" type="tel" style={inp} /></Field>
                  <Field label="Enrolled Date"><input name="enrolled_date" type="date" style={inp} defaultValue={new Date().toISOString().split('T')[0]} /></Field>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" style={{ ...submitBtn, width: '100%' }}>Enrol</button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right: add class form */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-deep-teal)', marginBottom: 12 }}>Add Class</div>
            <form action={createClass} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="hidden" name="masjid_id" value={masjidId} />
              <Field label="Class Name *"><input name="name" required style={inp} placeholder="e.g. Quran Beginners" /></Field>
              <Field label="Grade / Level"><input name="grade_level" style={inp} placeholder="e.g. Grade 1 / Noorani" /></Field>
              <Field label="Teacher">
                <select name="teacher_staff_id" style={inp}>
                  <option value="">— unassigned —</option>
                  {(staffList ?? []).map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </Field>
              <Field label="Schedule"><input name="schedule" style={inp} placeholder="e.g. Mon/Wed/Fri 5:00–6:30pm" /></Field>
              <Field label="Max Students"><input name="max_students" type="number" min={1} style={inp} /></Field>
              <Field label="Fee / Month (LKR)"><input name="fee_per_month" type="number" min={0} step={100} style={inp} defaultValue={0} /></Field>
              <button type="submit" style={submitBtn}>Add Class</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Fee Collection tab ── */}
      {tab === 'fees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Month/year selector + generate */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <form method="GET" style={{ display: 'flex', gap: 8 }}>
              <input type="hidden" name="tab"        value="fees" />
              <input type="hidden" name="masjid_id"  value={masjidId} />
              <select name="month" style={sel} defaultValue={month}>
                {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <select name="year" style={sel} defaultValue={year}>
                {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button type="submit" style={filterBtn}>View</button>
            </form>
            <form action={generateMadarsaFees}>
              <input type="hidden" name="masjid_id" value={masjidId} />
              <input type="hidden" name="year"      value={year} />
              <input type="hidden" name="month"     value={month} />
              <button type="submit" style={{ ...filterBtn, background: 'var(--color-primary-green)' }}>Generate Fee Records</button>
            </form>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Stat label="Total Due"    value={formatLKR(totalDue)}                          color="var(--color-warning)" />
            <Stat label="Collected"    value={formatLKR(totalPaid)}                         color="var(--color-primary-green)" />
            <Stat label="Unpaid"       value={String(unpaidFees.length)}                    color="var(--color-danger)" />
          </div>

          {/* Fees table */}
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-neutral-light)' }}>
                  {['Student', 'Amount Due', 'Paid', 'Status', 'Pay'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '9px 14px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(fees ?? []).length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)' }}>No fee records. Click "Generate Fee Records" first.</td></tr>
                )}
                {(fees ?? []).map(f => {
                  const st = f.madarsa_students as { full_name: string } | null
                  const statusColor = f.status === 'paid' ? '#16a34a' : f.status === 'partial' ? '#d97706' : '#dc2626'
                  return (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--color-neutral-light)' }}>
                      <td style={{ padding: '9px 14px', fontWeight: 500 }}>{st?.full_name ?? '—'}</td>
                      <td style={{ padding: '9px 14px' }}>{formatLKR(f.amount_due)}</td>
                      <td style={{ padding: '9px 14px' }}>{formatLKR(f.amount_paid ?? 0)}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ background: statusColor + '20', color: statusColor, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          {f.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        {f.status !== 'paid' && f.status !== 'waived' && (
                          <form action={recordMadarsaPayment} style={{ display: 'flex', gap: 6 }}>
                            <input type="hidden" name="fee_id" value={f.id} />
                            <input name="amount_paid" type="number" min={1} defaultValue={f.amount_due - (f.amount_paid ?? 0)} style={{ ...inp, width: 90, padding: '4px 8px' }} />
                            <button type="submit" style={{ fontSize: 12, background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Pay</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: '14px 18px', borderTop: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}
const inp: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', background: 'white' }
const submitBtn: React.CSSProperties = { background: 'var(--color-deep-teal)', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
const sel: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: 'white' }
const filterBtn: React.CSSProperties = { background: 'var(--color-deep-teal)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }
