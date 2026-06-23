import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@masjidhub/utils'
import { updateAnnouncementStatus } from './actions'

const TABS = [
  ['all',               'All'],
  ['general',           'General'],
  ['janaza',            'Janaza'],
  ['jumma',             'Jumma'],
  ['ramadan',           'Ramadan'],
  ['payment_reminder',  'Fee Reminders'],
  ['emergency',         'Emergency'],
]

const STATUS_COLORS: Record<string, string> = {
  draft:     '#6b7280',
  scheduled: '#d97706',
  published: '#16a34a',
  archived:  '#9ca3af',
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string }
}) {
  const supabase     = await createClient()
  const category     = searchParams.category ?? 'all'
  const statusFilter = searchParams.status ?? ''

  let query = supabase
    .from('announcements')
    .select('id, title, category, audience, priority, status, publish_at, expires_at, created_at, image_url, masjid_id')
    .order('created_at', { ascending: false })

  if (category !== 'all') query = query.eq('category', category)
  if (statusFilter)        query = query.eq('status', statusFilter)

  const { data: announcements } = await query.limit(50)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Announcements</h1>
        <Link href="/announcements/add" style={addBtn}>+ New Announcement</Link>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(([v, l]) => (
          <Link key={v} href={`/announcements?category=${v}${statusFilter ? `&status=${statusFilter}` : ''}`}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, textDecoration: 'none',
              background: category === v ? 'var(--color-primary-green)' : 'white',
              color:      category === v ? 'white' : 'var(--color-text-secondary)',
              border:     '1px solid var(--color-neutral-light)',
            }}>
            {l}
          </Link>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'draft', 'scheduled', 'published', 'archived'].map(s => (
          <Link key={s} href={`/announcements?category=${category}${s ? `&status=${s}` : ''}`}
            style={{
              padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, textDecoration: 'none',
              background: statusFilter === s ? (STATUS_COLORS[s] ?? 'var(--color-deep-teal)') : 'var(--color-neutral-light)',
              color: statusFilter === s ? 'white' : 'var(--color-text-secondary)',
            }}>
            {s || 'All Statuses'}
          </Link>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(announcements ?? []).length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)', background: 'white', borderRadius: 12 }}>
            No announcements found.
          </div>
        )}
        {(announcements ?? []).map(a => (
          <div key={a.id} style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {a.image_url && (
              <img src={a.image_url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{a.title}</span>
                {a.priority === 'urgent' && <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#dc2626', padding: '2px 7px', borderRadius: 999 }}>URGENT</span>}
                {a.priority === 'high'   && <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#d97706', padding: '2px 7px', borderRadius: 999 }}>HIGH</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                {a.category.replace(/_/g, ' ')} · {a.audience.replace(/_/g, ' ')} · {formatDate(a.publish_at ?? a.created_at)}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: (STATUS_COLORS[a.status] ?? '#6b7280') + '20', color: STATUS_COLORS[a.status] ?? '#6b7280' }}>
                  {a.status.toUpperCase()}
                </span>
                {a.status === 'draft' && (
                  <form action={updateAnnouncementStatus.bind(null, a.id, 'published', a.masjid_id)}>
                    <button type="submit" style={{ fontSize: 12, background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>Publish</button>
                  </form>
                )}
                {a.status === 'published' && (
                  <form action={updateAnnouncementStatus.bind(null, a.id, 'archived', a.masjid_id)}>
                    <button type="submit" style={{ fontSize: 12, background: 'var(--color-neutral-light)', color: 'var(--color-text-secondary)', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>Archive</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const addBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }
