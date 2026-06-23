import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createMasjidAccount } from '../actions'
import { SRI_LANKA_DISTRICTS } from '@masjidhub/config'

export default async function CreateMasjidPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: isSuperAdmin } = await admin.from('super_admins').select('id').eq('id', user.id).single()
  if (!isSuperAdmin) redirect('/dashboard')

  // Generate a random password suggestion
  const suggestedPass = `Masjid@${Math.floor(1000 + Math.random() * 9000)}`

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <Link href="/super-admin" style={{ color: '#6b7280', fontSize: 13 }}>← All Masjids</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '10px 0 6px', color: '#111' }}>Create Masjid Account</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>
          This creates a login for a masjid admin. Share the email and password with them directly.
        </p>

        <form action={createMasjidAccount} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Masjid info */}
          <Section title="Masjid Information">
            <Field label="Masjid Name *">
              <input name="masjid_name" required style={inp} placeholder="e.g. Masjid Al-Noor, Colombo" />
            </Field>
            <div style={grid2}>
              <Field label="Masjid Type *">
                <select name="masjid_type" required style={inp}>
                  <option value="jumma_masjid">Jumma Masjid</option>
                  <option value="madrasa">Madrasa</option>
                  <option value="community_masjid">Community Masjid</option>
                  <option value="jamiyath">Jamiyath</option>
                </select>
              </Field>
              <Field label="Subscription Plan *">
                <select name="plan" required style={inp}>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Login credentials */}
          <Section title="Login Credentials">
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              Share these with the masjid admin. They will use this to log in and complete their profile.
            </p>
            <Field label="Email Address *">
              <input name="email" type="email" required style={inp} placeholder="admin@masjidalnoor.lk" />
            </Field>
            <Field label="Temporary Password *">
              <input name="password" required style={inp} defaultValue={suggestedPass} />
            </Field>
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: 10, fontSize: 12, color: '#92400e' }}>
              ⚠ Copy and send this password to the masjid admin securely. They should change it after first login.
            </div>
          </Section>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" style={submitBtn}>Create Account</button>
            <Link href="/super-admin" style={cancelBtn}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f5e6b', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{label}</label>
      {children}
    </div>
  )
}
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const inp: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, width: '100%', background: 'white' }
const submitBtn: React.CSSProperties = { background: '#1a7a4a', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 24px', fontSize: 15, textDecoration: 'none', display: 'inline-block' }
