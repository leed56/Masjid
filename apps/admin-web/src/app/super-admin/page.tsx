import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@masjidhub/utils'
import { suspendMasjid, activateMasjid } from './actions'

export default async function SuperAdminPage() {
  // Auth guard — only super_admins
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: isSuperAdmin } = await admin.from('super_admins').select('id').eq('id', user.id).single()
  if (!isSuperAdmin) redirect('/dashboard')

  const { data: masjids } = await admin
    .from('masjids')
    .select('id, name, type, status, profile_complete, setup_step, email, district, created_at, subscriptions(plan, status)')
    .order('created_at', { ascending: false })

  const total    = (masjids ?? []).length
  const active   = (masjids ?? []).filter(m => m.status === 'active').length
  const complete = (masjids ?? []).filter(m => m.profile_complete).length

  const STATUS_COLORS: Record<string, string> = {
    active:    '#16a34a',
    suspended: '#dc2626',
    inactive:  '#9ca3af',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0', padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 1, marginBottom: 4 }}>MASJIDHUB LK — SUPER ADMIN</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111' }}>All Masjids</h1>
        </div>
        <Link href="/super-admin/create" style={addBtn}>+ Create Masjid Account</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Masjids"        value={total}    color="#0f5e6b" />
        <StatCard label="Active"               value={active}   color="#16a34a" />
        <StatCard label="Profile Complete"     value={complete} color="#1a7a4a" />
        <StatCard label="Incomplete Setup"     value={total - complete} color="#d97706" />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Masjid', 'District', 'Plan', 'Profile', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(masjids ?? []).map(m => {
              const sub = Array.isArray(m.subscriptions) ? m.subscriptions[0] : m.subscriptions as any
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#111' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{m.type?.replace(/_/g, ' ')}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{m.district ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      {sub?.plan?.toUpperCase() ?? 'FREE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {m.profile_complete
                      ? <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 12 }}>✓ Complete</span>
                      : <span style={{ color: '#d97706', fontSize: 12 }}>Step {m.setup_step}/6</span>
                    }
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: (STATUS_COLORS[m.status] ?? '#9ca3af') + '20', color: STATUS_COLORS[m.status] ?? '#9ca3af', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      {m.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12 }}>{formatDate(m.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/super-admin/${m.id}`} style={actionBtn('#0f5e6b')}>Edit</Link>
                      {m.status === 'active'
                        ? <form action={suspendMasjid.bind(null, m.id)}>
                            <button type="submit" style={actionBtnStyle('#dc2626')}>Suspend</button>
                          </form>
                        : <form action={activateMasjid.bind(null, m.id)}>
                            <button type="submit" style={actionBtnStyle('#16a34a')}>Activate</button>
                          </form>
                      }
                    </div>
                  </td>
                </tr>
              )
            })}
            {(masjids ?? []).length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>No masjids yet. Create one to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '16px 24px', borderTop: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
    </div>
  )
}

const addBtn: React.CSSProperties = { background: '#1a7a4a', color: 'white', padding: '11px 22px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700 }
const actionBtn = (color: string): React.CSSProperties => ({ background: color + '15', color, padding: '4px 10px', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 600 })
const actionBtnStyle = (color: string): React.CSSProperties => ({ background: color + '15', color, padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' })
