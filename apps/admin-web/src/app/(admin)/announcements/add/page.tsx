import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createAnnouncement } from '../actions'

const CATEGORIES = [
  ['general',          'General Notice'],
  ['janaza',           'Janaza'],
  ['jumma',            'Jumma Reminder'],
  ['ramadan',          'Ramadan Program'],
  ['madarsa',          'Madarsa Notice'],
  ['development_appeal','Development Appeal'],
  ['payment_reminder', 'Payment Reminder'],
  ['emergency',        'Emergency Notice'],
  ['volunteer',        'Volunteer Request'],
]

const AUDIENCES = [
  ['all_members',     'All Members'],
  ['selected_area',   'Selected Area'],
  ['unpaid_members',  'Unpaid Members'],
  ['donors',          'Donors'],
  ['madarsa_parents', 'Madarsa Parents'],
  ['committee',       'Committee Only'],
  ['public',          'Public'],
]

export default async function AddAnnouncementPage() {
  const supabase = await createClient()
  const { data: masjids } = await supabase.from('masjids').select('id, name').eq('status', 'active')

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/announcements" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Announcements</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 24px' }}>Create Announcement</h1>

      <form action={createAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Details">
          <div style={grid2}>
            <Field label="Masjid *">
              <select name="masjid_id" required style={inp}>
                {(masjids ?? []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Category *">
              <select name="category" required style={inp}>
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Audience *">
              <select name="audience" required style={inp}>
                {AUDIENCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select name="priority" style={inp} defaultValue="normal">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
          </div>
          <Field label="Title *" style={{ marginTop: 8 }}>
            <input name="title" required style={inp} placeholder="Announcement title" />
          </Field>
          <Field label="Body *" style={{ marginTop: 8 }}>
            <textarea name="body" required rows={6} style={{ ...inp, resize: 'vertical' }} placeholder="Write the announcement…" />
          </Field>
        </Card>

        <Card title="Scheduling">
          <div style={grid2}>
            <Field label="Publish At (leave blank to save as draft)">
              <input name="publish_at" type="datetime-local" style={inp} />
            </Field>
            <Field label="Expires At (optional)">
              <input name="expires_at" type="datetime-local" style={inp} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input name="publish_now" type="checkbox" value="true" />
              Publish immediately
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input name="send_push" type="checkbox" value="true" defaultChecked />
              Send push notification
            </label>
          </div>
        </Card>

        <Card title="Image (optional)">
          <input name="image" type="file" accept="image/*" style={{ fontSize: 14 }} />
        </Card>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" style={submitBtn}>Save Announcement</button>
          <Link href="/announcements" style={cancelBtn}>Cancel</Link>
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
const submitBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: 'white', color: 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '12px 24px', fontSize: 15, textDecoration: 'none', display: 'inline-block' }
