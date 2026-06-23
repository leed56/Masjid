import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createJanazaAnnouncement } from '../../announcements/actions'
import { SRI_LANKA_DISTRICTS } from '@masjidhub/config'

export default async function AddJanazaPage() {
  const supabase = await createClient()
  const { data: masjids } = await supabase.from('masjids').select('id, name').eq('status', 'active')

  const defaultDateTime = new Date()
  defaultDateTime.setHours(defaultDateTime.getHours() + 3)
  const defaultJanazaTime = defaultDateTime.toISOString().slice(0, 16)

  return (
    <div style={{ maxWidth: 680 }}>
      <Link href="/janaza" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Janaza Announcements</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 4px' }}>New Janaza Announcement</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 24 }}>Inna lillahi wa inna ilayhi raji'un</p>

      <form action={createJanazaAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Deceased Information">
          <div style={grid2}>
            <Field label="Masjid *">
              <select name="masjid_id" required style={inp}>
                {(masjids ?? []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Deceased Full Name *">
              <input name="deceased_name" required style={inp} placeholder="e.g. Mohamed Ismail s/o Abdul Hameed" />
            </Field>
            <Field label="Gender">
              <select name="gender" style={inp}>
                <option value="">— not specified —</option>
                <option value="male">Male (Br.)</option>
                <option value="female">Female (Sis.)</option>
              </select>
            </Field>
            <Field label="Age (optional)">
              <input name="age" type="number" min={0} max={150} style={inp} placeholder="e.g. 72" />
            </Field>
            <Field label="Area / Town *">
              <select name="area" required style={inp}>
                <option value="">Select district…</option>
                {SRI_LANKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Family Relation (optional)">
              <input name="family_relation" style={inp} placeholder="e.g. Father of Br. Ahmed Ismail" />
            </Field>
          </div>
        </Card>

        <Card title="Janaza Details">
          <div style={grid2}>
            <Field label="Janaza Time *">
              <input name="janaza_time" type="datetime-local" required style={inp} defaultValue={defaultJanazaTime} />
            </Field>
            <Field label="Burial Place *">
              <input name="burial_place" required style={inp} placeholder="e.g. Masjid compound / Kanatta cemetery" />
            </Field>
            <Field label="Contact Person (optional)">
              <input name="contact_person" style={inp} placeholder="e.g. Br. Hassan — 077 123 4567" />
            </Field>
            <Field label="Visibility">
              <select name="visibility" style={inp} defaultValue="all_members">
                <option value="all_members">All Members</option>
                <option value="committee_only">Committee Only</option>
                <option value="public">Public</option>
              </select>
            </Field>
          </div>
          <Field label="Additional Message (optional)" style={{ marginTop: 8 }}>
            <textarea name="message" rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Condolences, special instructions, gathering location…" />
          </Field>
        </Card>

        <Card title="Notification Options">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
              <input name="auto_approve" type="checkbox" value="true" defaultChecked />
              <div>
                <div style={{ fontWeight: 500 }}>Approve immediately</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Uncheck if this needs committee approval first</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
              <input name="send_push" type="checkbox" value="true" defaultChecked />
              <div>
                <div style={{ fontWeight: 500 }}>Send push notification</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Sends immediately to all masjid members</div>
              </div>
            </label>
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" style={submitBtn}>Post Janaza Notice</button>
          <Link href="/janaza" style={cancelBtn}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14, color: 'var(--color-deep-teal)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
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
const submitBtn: React.CSSProperties = { background: 'var(--color-deep-teal)', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: 'white', color: 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '12px 24px', fontSize: 15, textDecoration: 'none', display: 'inline-block' }
