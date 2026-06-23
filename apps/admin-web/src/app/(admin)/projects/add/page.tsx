import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createProject } from '../actions'

export default async function AddProjectPage() {
  const supabase = await createClient()
  const { data: masjids } = await supabase.from('masjids').select('id, name').eq('status', 'active')
  const { data: funds }   = await supabase.from('funds').select('id, name, masjid_id').eq('status', 'active')

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/projects" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Development Projects</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 24px' }}>New Development Project</h1>

      <form action={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <div style={grid2}>
            <Field label="Masjid *">
              <select name="masjid_id" required style={inp}>
                {(masjids ?? []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Linked Fund (donations credit here)">
              <select name="fund_id" style={inp}>
                <option value="">— none —</option>
                {(funds ?? []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Project Title *" style={{ marginTop: 8 }}>
            <input name="title" required style={inp} placeholder="e.g. New Ablution Block Construction" />
          </Field>
          <Field label="Description" style={{ marginTop: 8 }}>
            <textarea name="description" rows={4} style={{ ...inp, resize: 'vertical' }} placeholder="Describe the project…" />
          </Field>
          <div style={{ ...grid2, marginTop: 8 }}>
            <Field label="Target Amount (LKR) *">
              <input name="target_amount" type="number" min={1} required style={inp} placeholder="e.g. 5000000" />
            </Field>
            <div />
            <Field label="Start Date">
              <input name="start_date" type="date" style={inp} />
            </Field>
            <Field label="Target Completion Date">
              <input name="target_date" type="date" style={inp} />
            </Field>
          </div>
          <Field label="Cover Image (optional)" style={{ marginTop: 8 }}>
            <input name="cover_image" type="file" accept="image/*" style={{ fontSize: 14 }} />
          </Field>
        </Card>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" style={submitBtn}>Create Project</button>
          <Link href="/projects" style={cancelBtn}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
}
function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const inp: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 12px', fontSize: 14, width: '100%', background: 'white' }
const submitBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: 'white', color: 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '12px 24px', fontSize: 15, textDecoration: 'none', display: 'inline-block' }
