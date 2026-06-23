import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@masjidhub/utils'

const ACTION_COLORS: Record<string, string> = {
  payment_approved:        '#16a34a',
  payment_rejected:        '#dc2626',
  expense_approved:        '#d97706',
  expense_deleted:         '#6b7280',
  salary_paid:             '#0f5e6b',
  announcement_published:  '#1a7a4a',
  fund_transfer:           '#7c3aed',
  announcement_archived:   '#9ca3af',
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string; entity?: string; masjid_id?: string }
}) {
  const supabase  = await createClient()
  const page      = Number(searchParams.page ?? 1)
  const entity    = searchParams.entity ?? ''
  const PAGE_SIZE = 50

  const { data: masjids } = await supabase.from('masjids').select('id, name').eq('status', 'active')
  const masjidId = searchParams.masjid_id ?? masjids?.[0]?.id ?? ''

  let query = supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, before_data, after_data, created_at, actor_user_id')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (masjidId) query = query.eq('masjid_id', masjidId)
  if (entity)   query = query.eq('entity_type', entity)

  const { data: logs, count } = await query

  const ENTITIES = ['', 'payments', 'expenses', 'staff_salaries', 'announcements', 'funds']

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Audit Log</h1>

      {/* Filters */}
      <form method="GET" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <select name="masjid_id" style={sel} defaultValue={masjidId}>
          {(masjids ?? []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select name="entity" style={sel} defaultValue={entity}>
          {ENTITIES.map(e => <option key={e} value={e}>{e || 'All Entities'}</option>)}
        </select>
        <button type="submit" style={filterBtn}>Filter</button>
      </form>

      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-neutral-light)' }}>
              {['Time', 'Action', 'Entity', 'Details'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>No audit entries found.</td></tr>
            )}
            {(logs ?? []).map(log => {
              const color = ACTION_COLORS[log.action] ?? '#6b7280'
              const after = log.after_data as Record<string, unknown> | null
              const detail = after ? Object.entries(after).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ') : ''
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-neutral-light)' }}>
                  <td style={{ padding: '9px 14px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {formatDate(log.created_at)}
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ background: color + '15', color, padding: '2px 8px', borderRadius: 999, fontWeight: 700, fontSize: 11 }}>
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px', color: 'var(--color-text-secondary)' }}>
                    {log.entity_type}
                  </td>
                  <td style={{ padding: '9px 14px', color: 'var(--color-text-secondary)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {detail}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        {page > 1 && (
          <a href={`/audit?page=${page - 1}&entity=${entity}&masjid_id=${masjidId}`} style={pageBtn}>← Previous</a>
        )}
        <span style={{ padding: '7px 14px', fontSize: 13, color: 'var(--color-text-secondary)' }}>Page {page}</span>
        {(logs?.length ?? 0) === PAGE_SIZE && (
          <a href={`/audit?page=${page + 1}&entity=${entity}&masjid_id=${masjidId}`} style={pageBtn}>Next →</a>
        )}
      </div>
    </div>
  )
}

const sel: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: 'white' }
const filterBtn: React.CSSProperties = { background: 'var(--color-deep-teal)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }
const pageBtn: React.CSSProperties = { background: 'white', color: 'var(--color-deep-teal)', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '7px 16px', fontSize: 13, textDecoration: 'none' }
