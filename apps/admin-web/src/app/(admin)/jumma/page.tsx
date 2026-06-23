import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLKR, formatDate } from '@masjidhub/utils'
import { createJummaProgram, markFeePaid } from './actions'

export default async function JummaPage({
  searchParams,
}: { searchParams: { masjid_id?: string } }) {
  const supabase = await createClient()
  const { data: masjids } = await supabase.from('masjids').select('id, name').eq('status', 'active')
  const { data: funds }   = await supabase.from('funds').select('id, name, masjid_id').eq('status', 'active')
  const masjidId = searchParams.masjid_id ?? masjids?.[0]?.id ?? ''

  const { data: programs } = await supabase
    .from('jumma_programs')
    .select('*')
    .eq('masjid_id', masjidId)
    .order('jumma_date', { ascending: false })
    .limit(52)

  const unpaidTotal = (programs ?? []).filter(p => !p.fee_paid).reduce((s, p) => s + (p.fee_amount ?? 0), 0)
  const paidTotal   = (programs ?? []).filter(p =>  p.fee_paid).reduce((s, p) => s + (p.fee_amount ?? 0), 0)

  // Next Friday
  const today  = new Date()
  const day    = today.getDay()
  const diff   = (5 - day + 7) % 7 || 7
  const nextFri = new Date(today)
  nextFri.setDate(today.getDate() + diff)
  const nextFriStr = nextFri.toISOString().split('T')[0]

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Jumma Guest Moulavi</h1>

      {/* Masjid selector */}
      {(masjids ?? []).length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(masjids ?? []).map(m => (
            <a key={m.id} href={`/jumma?masjid_id=${m.id}`}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, textDecoration: 'none', background: masjidId === m.id ? 'var(--color-deep-teal)' : 'white', color: masjidId === m.id ? 'white' : 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)' }}>
              {m.name}
            </a>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Left: list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Stat label="Total Programs"  value={String((programs ?? []).length)} color="var(--color-deep-teal)" />
            <Stat label="Fees Paid"       value={formatLKR(paidTotal)}            color="var(--color-primary-green)" />
            <Stat label="Fees Pending"    value={formatLKR(unpaidTotal)}          color="var(--color-warning)" />
          </div>

          {/* Programs table */}
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-neutral-light)' }}>
                  {['Date', 'Moulavi', 'Topic', 'Fee', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '9px 14px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(programs ?? []).length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)' }}>No programs yet.</td></tr>
                )}
                {(programs ?? []).map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-neutral-light)' }}>
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>{formatDate(p.jumma_date)}</td>
                    <td style={{ padding: '9px 14px', fontWeight: 500 }}>
                      {p.moulavi_name}
                      {p.moulavi_phone && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{p.moulavi_phone}</div>}
                    </td>
                    <td style={{ padding: '9px 14px', color: 'var(--color-text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.topic ?? '—'}</td>
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>{p.fee_amount ? formatLKR(p.fee_amount) : '—'}</td>
                    <td style={{ padding: '9px 14px' }}>
                      {p.fee_paid
                        ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>PAID</span>
                        : <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>UNPAID</span>
                      }
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      {!p.fee_paid && p.fee_amount > 0 && (
                        <form action={markFeePaid.bind(null, p.id, masjidId, p.fund_id, p.fee_amount)}>
                          <button type="submit" style={{ fontSize: 12, background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>Mark Paid</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: add form */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-deep-teal)', marginBottom: 14 }}>Add Jumma Program</div>
          <form action={createJummaProgram} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="hidden" name="masjid_id" value={masjidId} />
            <Field label="Jumma Date *"><input name="jumma_date" type="date" required style={inp} defaultValue={nextFriStr} /></Field>
            <Field label="Moulavi Name *"><input name="moulavi_name" required style={inp} /></Field>
            <Field label="Phone"><input name="moulavi_phone" type="tel" style={inp} /></Field>
            <Field label="Topic / Khutba Title"><input name="topic" style={inp} /></Field>
            <Field label="Honorarium (LKR)"><input name="fee_amount" type="number" min={0} step={500} style={inp} defaultValue={0} /></Field>
            <Field label="Deduct From Fund">
              <select name="fund_id" style={inp}>
                <option value="">— none —</option>
                {(funds ?? []).filter(f => f.masjid_id === masjidId).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
            <Field label="Transport Arranged"><input name="transport" style={inp} placeholder="e.g. Own vehicle / Club pickup" /></Field>
            <Field label="Notes"><textarea name="notes" rows={2} style={{ ...inp, resize: 'vertical' }} /></Field>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input name="fee_paid" type="checkbox" value="true" />
              Fee paid at time of entry
            </label>
            <button type="submit" style={submitBtn}>Save Program</button>
          </form>
        </div>
      </div>
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
const submitBtn: React.CSSProperties = { background: 'var(--color-deep-teal)', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }
