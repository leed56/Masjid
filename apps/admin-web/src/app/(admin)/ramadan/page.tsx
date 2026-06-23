import { createClient } from '@/lib/supabase/server'
import { formatLKR, formatDate } from '@masjidhub/utils'
import { createRamadanProgram, addIftharSponsor } from './actions'

export default async function RamadanPage({
  searchParams,
}: { searchParams: { masjid_id?: string; program_id?: string } }) {
  const supabase = await createClient()
  const { data: masjids } = await supabase.from('masjids').select('id, name').eq('status', 'active')
  const masjidId = searchParams.masjid_id ?? masjids?.[0]?.id ?? ''

  const { data: programs } = await supabase
    .from('ramadan_programs')
    .select('*')
    .eq('masjid_id', masjidId)
    .order('gregorian_year', { ascending: false })

  const selectedProgram = searchParams.program_id
    ? programs?.find(p => p.id === searchParams.program_id)
    : programs?.[0]

  const { data: sponsors } = selectedProgram
    ? await supabase
        .from('ramadan_ifthar_sponsors')
        .select('*')
        .eq('program_id', selectedProgram.id)
        .order('date', { ascending: true })
    : { data: [] }

  const totalSponsored  = (sponsors ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const confirmedCount  = (sponsors ?? []).filter(s => s.is_confirmed).length
  const currentYear     = new Date().getFullYear()

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Ramadan Program</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left: Program info + sponsors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Program selector */}
          {(programs ?? []).length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(programs ?? []).map(p => (
                <a key={p.id}
                  href={`/ramadan?masjid_id=${masjidId}&program_id=${p.id}`}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                    background: selectedProgram?.id === p.id ? 'var(--color-primary-green)' : 'white',
                    color:      selectedProgram?.id === p.id ? 'white' : 'var(--color-text-secondary)',
                    border:     '1px solid var(--color-neutral-light)',
                  }}>
                  {p.gregorian_year} / {p.hijri_year}H
                </a>
              ))}
            </div>
          )}

          {selectedProgram ? (
            <>
              {/* Program details */}
              <Card title={`${selectedProgram.gregorian_year} Program Details`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12 }}>
                  <Info label="Iftar Time"      value={selectedProgram.iftar_time ?? '—'} />
                  <Info label="Sehri Time"      value={selectedProgram.sehri_time ?? '—'} />
                  <Info label="Tarawih Time"    value={selectedProgram.tarawih_time ?? '—'} />
                  <Info label="Tarawih Rakats"  value={String(selectedProgram.tarawih_rakats ?? 20)} />
                  <Info label="Imam"            value={selectedProgram.imam_name ?? '—'} />
                  <Info label="Hafiz"           value={selectedProgram.hafiz_name ?? '—'} />
                  <Info label="Daily Budget"    value={selectedProgram.daily_ifthar_budget ? formatLKR(selectedProgram.daily_ifthar_budget) : '—'} />
                </div>
                {selectedProgram.notes && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{selectedProgram.notes}</p>}
              </Card>

              {/* Summary stats */}
              <div style={{ display: 'flex', gap: 12 }}>
                <Stat label="Total Sponsors"     value={String((sponsors ?? []).length)}   color="var(--color-deep-teal)" />
                <Stat label="Confirmed"          value={String(confirmedCount)}             color="var(--color-primary-green)" />
                <Stat label="Total Sponsored"    value={formatLKR(totalSponsored)}          color="var(--color-gold)" />
              </div>

              {/* Ifthar sponsors list */}
              <Card title="Ifthar Sponsors">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--color-neutral-light)' }}>
                        {['Date', 'Sponsor', 'Phone', 'Amount', 'Status'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(sponsors ?? []).length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-secondary)' }}>No sponsors yet.</td></tr>
                      )}
                      {(sponsors ?? []).map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--color-neutral-light)' }}>
                          <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{formatDate(s.date)}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.sponsor_name}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{s.phone ?? '—'}</td>
                          <td style={{ padding: '8px 12px' }}>{s.amount ? formatLKR(s.amount) : '—'}</td>
                          <td style={{ padding: '8px 12px' }}>
                            {s.is_confirmed
                              ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>CONFIRMED</span>
                              : <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>PENDING</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Add sponsor form */}
              <Card title="Add Ifthar Sponsor">
                <form action={addIftharSponsor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input type="hidden" name="masjid_id"  value={masjidId} />
                  <input type="hidden" name="program_id" value={selectedProgram.id} />
                  <div style={grid2}>
                    <Field label="Sponsor Name *"><input name="sponsor_name" required style={inp} /></Field>
                    <Field label="Phone"><input name="phone" type="tel" style={inp} /></Field>
                    <Field label="Date *"><input name="date" type="date" required style={inp} /></Field>
                    <Field label="Amount (LKR)"><input name="amount" type="number" min={0} step={100} style={inp} /></Field>
                  </div>
                  <Field label="Notes"><input name="notes" style={inp} /></Field>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                    <input name="is_confirmed" type="checkbox" value="true" defaultChecked />
                    Confirmed sponsor
                  </label>
                  <button type="submit" style={submitBtn}>Add Sponsor</button>
                </form>
              </Card>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)', background: 'white', borderRadius: 12 }}>
              No program set up yet. Create one →
            </div>
          )}
        </div>

        {/* Right: Create program form */}
        <Card title="New Ramadan Program">
          <form action={createRamadanProgram} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Masjid *">
              <select name="masjid_id" required style={inp}>
                {(masjids ?? []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Gregorian Year *"><input name="gregorian_year" type="number" required style={inp} defaultValue={currentYear} /></Field>
            <Field label="Hijri Year *"><input name="hijri_year" type="number" required style={inp} defaultValue={1446} /></Field>
            <Field label="Iftar Time"><input name="iftar_time" type="time" style={inp} /></Field>
            <Field label="Sehri Time"><input name="sehri_time" type="time" style={inp} /></Field>
            <Field label="Tarawih Time"><input name="tarawih_time" type="time" style={inp} /></Field>
            <Field label="Tarawih Rakats"><input name="tarawih_rakats" type="number" style={inp} defaultValue={20} /></Field>
            <Field label="Imam"><input name="imam_name" style={inp} /></Field>
            <Field label="Hafiz"><input name="hafiz_name" style={inp} /></Field>
            <Field label="Daily Ifthar Budget (LKR)"><input name="daily_ifthar_budget" type="number" min={0} style={inp} /></Field>
            <Field label="Notes"><textarea name="notes" rows={3} style={{ ...inp, resize: 'vertical' }} /></Field>
            <button type="submit" style={submitBtn}>Create Program</button>
          </form>
        </Card>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-deep-teal)', marginBottom: 14 }}>{title}</div>
      {children}
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
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 14, marginTop: 2 }}>{value}</div>
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
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
const inp: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', background: 'white' }
const submitBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }
