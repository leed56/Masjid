import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createFamily } from './actions'

export default async function FamiliesPage() {
  const supabase = await createClient()

  const { data: families } = await supabase
    .from('families')
    .select('*, members(count)')
    .order('family_name')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Link href="/members" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Members</Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>Families</h1>
        </div>
        <button
          id="add-family-btn"
          onClick={() => {}}
          style={{ background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Family
        </button>
      </div>

      <AddFamilyForm action={createFamily} />

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--color-light-cream)' }}>
              {['Family Name','Area','Category','Members','Collector'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(families ?? []).map((f, i) => (
              <tr key={f.id} style={{ borderTop: i > 0 ? '1px solid var(--color-neutral-light)' : undefined }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{f.family_name}</td>
                <td style={{ padding: '12px 16px' }}>{f.area}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                    {f.category}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {Array.isArray(f.members) ? f.members.length : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                  {f.collector_id ? f.collector_id : '—'}
                </td>
              </tr>
            ))}
            {!families?.length && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No families yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AddFamilyForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  return (
    <form action={action} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={lbl}>Family Name *</label>
        <input name="family_name" required style={inp} placeholder="Al-Hassan Family" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={lbl}>Address *</label>
        <input name="address" required style={inp} placeholder="123 Main St" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={lbl}>Area *</label>
        <input name="area" required style={inp} placeholder="Wellampitiya" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={lbl}>Category</label>
        <select name="category" style={inp}>
          <option value="standard">Standard</option>
          <option value="poor">Poor</option>
          <option value="sponsor_supported">Sponsored</option>
          <option value="committee">Committee</option>
          <option value="exempted">Exempted</option>
        </select>
      </div>
      {/* hidden — replace with actual masjid from session */}
      <input type="hidden" name="masjid_id" value="" />
      <button type="submit" style={{ background: 'var(--color-deep-teal)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', gridColumn: '4', alignSelf: 'end', height: 40 }}>
        Add
      </button>
    </form>
  )
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }
const inp: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 12px', fontSize: 14, width: '100%' }
