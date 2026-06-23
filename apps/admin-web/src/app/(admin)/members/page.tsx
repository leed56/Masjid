import { createClient } from '@/lib/supabase/server'
import type { Member } from '@masjidhub/types'
import { formatDate } from '@masjidhub/utils'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: members, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return <p style={{ color: 'var(--color-danger)' }}>Failed to load members.</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Members</h1>
        <a
          href="/members/add"
          style={{
            background: 'var(--color-primary-green)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + Add Member
        </a>
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--color-light-cream)', textAlign: 'left' }}>
              {['Code','Name','Phone','Area','Fee (LKR)','Status','Registered'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(members as Member[]).map((m, i) => (
              <tr key={m.id} style={{ borderTop: i > 0 ? '1px solid var(--color-neutral-light)' : undefined }}>
                <td style={td}>{m.member_code}</td>
                <td style={{ ...td, fontWeight: 500 }}>{m.full_name}</td>
                <td style={td}>{m.phone ?? '—'}</td>
                <td style={td}>{m.area}</td>
                <td style={td}>{m.monthly_fee_amount.toLocaleString()}</td>
                <td style={td}>
                  <StatusBadge status={m.status} />
                </td>
                <td style={td}>{formatDate(m.registered_date)}</td>
              </tr>
            ))}
            {members?.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No members yet. Add your first member.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const td: React.CSSProperties = { padding: '12px 16px', color: 'var(--color-text-primary)' }

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: '#dcfce7',
    inactive: '#f3f4f6',
    exempted: '#fef3c7',
    deceased: '#fee2e2',
    moved: '#e0f2fe',
  }
  const text: Record<string, string> = {
    active: '#166534',
    inactive: '#6b7280',
    exempted: '#92400e',
    deceased: '#991b1b',
    moved: '#0369a1',
  }
  return (
    <span style={{
      background: colors[status] ?? '#f3f4f6',
      color: text[status] ?? '#374151',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
    }}>
      {status}
    </span>
  )
}
