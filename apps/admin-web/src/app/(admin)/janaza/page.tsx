import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@masjidhub/utils'

export default async function JanazaPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('janaza_announcements')
    .select('*')
    .order('janaza_time', { ascending: false })
    .limit(50)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Janaza Announcements</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 2 }}>Inna lillahi wa inna ilayhi raji'un</p>
        </div>
        <Link href="/janaza/add" style={addBtn}>+ Janaza Notice</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(announcements ?? []).length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-secondary)', background: 'white', borderRadius: 12 }}>
            No janaza announcements.
          </div>
        )}
        {(announcements ?? []).map(j => (
          <div key={j.id} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '4px solid var(--color-deep-teal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{j.deceased_name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {j.gender ? `${j.gender} · ` : ''}{j.age ? `Age ${j.age} · ` : ''}{j.area}
                </div>
              </div>
              <div>
                {j.approved_by
                  ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 999, fontWeight: 700, fontSize: 11 }}>APPROVED</span>
                  : <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 999, fontWeight: 700, fontSize: 11 }}>PENDING</span>
                }
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 14 }}>
              <InfoItem label="Janaza Time"  value={formatDate(j.janaza_time)} />
              <InfoItem label="Burial Place" value={j.burial_place} />
              {j.contact_person && <InfoItem label="Contact" value={j.contact_person} />}
              {j.family_relation && <InfoItem label="Family"  value={j.family_relation} />}
            </div>
            {j.message && (
              <div style={{ marginTop: 10, padding: 10, background: 'var(--color-light-cream)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                {j.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  )
}

const addBtn: React.CSSProperties = { background: 'var(--color-deep-teal)', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }
