import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLKR, formatDate } from '@masjidhub/utils'
import { addDonation, updateProjectStatus } from './actions'

const STATUS_COLORS: Record<string, string> = {
  active:    '#16a34a',
  completed: '#0f5e6b',
  paused:    '#d97706',
  cancelled: '#6b7280',
}

export default async function ProjectsPage({
  searchParams,
}: { searchParams: { masjid_id?: string; project_id?: string; status?: string } }) {
  const supabase  = await createClient()
  const { data: masjids } = await supabase.from('masjids').select('id, name').eq('status', 'active')
  const { data: funds }   = await supabase.from('funds').select('id, name, masjid_id').eq('status', 'active')
  const masjidId  = searchParams.masjid_id ?? masjids?.[0]?.id ?? ''
  const statusFilter = searchParams.status ?? 'active'

  let q = supabase
    .from('development_projects')
    .select('*')
    .eq('masjid_id', masjidId)
    .order('created_at', { ascending: false })
  if (statusFilter !== 'all') q = q.eq('status', statusFilter)
  const { data: projects } = await q

  const selectedId = searchParams.project_id ?? projects?.[0]?.id ?? ''
  const selected   = projects?.find(p => p.id === selectedId)

  const { data: donations } = selected
    ? await supabase.from('project_donations').select('*').eq('project_id', selectedId).order('donated_at', { ascending: false })
    : { data: [] }

  const totalTarget = (projects ?? []).reduce((s, p) => s + p.target_amount, 0)
  const totalRaised = (projects ?? []).reduce((s, p) => s + p.raised_amount, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Development Projects</h1>
        <Link href="/projects/add" style={addBtn}>+ New Project</Link>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'active', 'completed', 'paused', 'cancelled'].map(s => (
          <a key={s} href={`/projects?masjid_id=${masjidId}&status=${s}`}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, textDecoration: 'none', background: statusFilter === s ? 'var(--color-deep-teal)' : 'white', color: statusFilter === s ? 'white' : 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)' }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </a>
        ))}
      </div>

      {/* Overview stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Stat label="Total Target"  value={formatLKR(totalTarget)} color="var(--color-warning)" />
        <Stat label="Total Raised"  value={formatLKR(totalRaised)} color="var(--color-primary-green)" />
        <Stat label="Projects"      value={String((projects ?? []).length)} color="var(--color-deep-teal)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* Project cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(projects ?? []).length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, background: 'white', borderRadius: 12, color: 'var(--color-text-secondary)' }}>
              No projects. <Link href="/projects/add" style={{ color: 'var(--color-primary-green)' }}>Create one →</Link>
            </div>
          )}
          {(projects ?? []).map(p => {
            const pct = Math.min(100, Math.round((p.raised_amount / p.target_amount) * 100))
            return (
              <a key={p.id} href={`/projects?masjid_id=${masjidId}&status=${statusFilter}&project_id=${p.id}`}
                style={{ textDecoration: 'none', display: 'block', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: selectedId === p.id ? '0 0 0 2px var(--color-primary-green)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                {p.cover_image_url && <img src={p.cover_image_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{p.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: (STATUS_COLORS[p.status] ?? '#6b7280') + '20', color: STATUS_COLORS[p.status] ?? '#6b7280' }}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                  {p.description && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{p.description}</p>}
                  {/* Progress bar */}
                  <div style={{ background: 'var(--color-neutral-light)', borderRadius: 999, height: 8, marginBottom: 6 }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: pct >= 100 ? 'var(--color-primary-green)' : 'var(--color-gold)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--color-primary-green)', fontWeight: 700 }}>{formatLKR(p.raised_amount)} raised</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>of {formatLKR(p.target_amount)} ({pct}%)</span>
                  </div>
                  {p.target_date && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>Target: {formatDate(p.target_date)}</div>}
                </div>
              </a>
            )
          })}
        </div>

        {/* Right panel: donations + add donation */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Status actions */}
            <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 8 }}>
              {selected.status !== 'completed' && (
                <form action={updateProjectStatus.bind(null, selected.id, 'completed')}>
                  <button type="submit" style={{ fontSize: 12, background: 'var(--color-deep-teal)', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>Mark Completed</button>
                </form>
              )}
              {selected.status === 'active' && (
                <form action={updateProjectStatus.bind(null, selected.id, 'paused')}>
                  <button type="submit" style={{ fontSize: 12, background: 'var(--color-neutral-light)', color: 'var(--color-text-secondary)', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>Pause</button>
                </form>
              )}
              {selected.status === 'paused' && (
                <form action={updateProjectStatus.bind(null, selected.id, 'active')}>
                  <button type="submit" style={{ fontSize: 12, background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>Resume</button>
                </form>
              )}
            </div>

            {/* Add donation */}
            <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-deep-teal)', marginBottom: 12 }}>Record Donation</div>
              <form action={addDonation} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="hidden" name="project_id" value={selected.id} />
                <input type="hidden" name="masjid_id"  value={masjidId} />
                <Field label="Donor Name *"><input name="donor_name" required style={inp} /></Field>
                <Field label="Phone"><input name="donor_phone" type="tel" style={inp} /></Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Field label="Amount (LKR) *"><input name="amount" type="number" min={1} required style={inp} /></Field>
                  <Field label="Date *"><input name="donated_at" type="date" required style={inp} defaultValue={new Date().toISOString().split('T')[0]} /></Field>
                </div>
                <Field label="Method">
                  <select name="method" style={inp}>
                    <option value="">—</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </Field>
                <Field label="Credit To Fund">
                  <select name="fund_id" style={inp}>
                    <option value="">— none —</option>
                    {(funds ?? []).filter(f => f.masjid_id === masjidId).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </Field>
                <Field label="Notes"><input name="notes" style={inp} /></Field>
                <button type="submit" style={submitBtn}>Record Donation</button>
              </form>
            </div>

            {/* Recent donations */}
            <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-deep-teal)', marginBottom: 12 }}>Donations ({(donations ?? []).length})</div>
              {(donations ?? []).length === 0 && <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>No donations yet.</p>}
              {(donations ?? []).map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-neutral-light)', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{d.donor_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{formatDate(d.donated_at)} · {d.method ?? '—'}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary-green)' }}>{formatLKR(d.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
const submitBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
const addBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }
