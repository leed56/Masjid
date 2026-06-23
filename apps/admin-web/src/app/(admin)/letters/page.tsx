import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const LETTER_TYPES = [
  {
    id:    'recommendation',
    title: 'Recommendation Letter',
    desc:  'General character/recommendation letter for a registered member',
    icon:  '📜',
    href:  '/letters/recommendation',
  },
  {
    id:    'membership',
    title: 'Membership Attestation',
    desc:  'Confirms the person is a registered member of this masjid',
    icon:  '🏷️',
    href:  '/letters/membership',
  },
  {
    id:    'residence',
    title: 'Residence Confirmation',
    desc:  'Confirms the member resides within the masjid area/community',
    icon:  '🏠',
    href:  '/letters/residence',
  },
  {
    id:    'donation_receipt',
    title: 'Donation Receipt Letter',
    desc:  'Official acknowledgement letter for a project donation',
    icon:  '🧾',
    href:  '/letters/donation',
  },
]

export default async function LettersPage() {
  const supabase = await createClient()
  const { data: mu } = await supabase.from('masjid_users').select('masjid_id').eq('role','masjid_admin').maybeSingle()
  const { data: masjid } = mu
    ? await supabase.from('masjids').select('name, logo_url, letterhead_url, profile_complete').eq('id', mu.masjid_id).single()
    : { data: null }

  const missingProfile = !masjid?.logo_url || !masjid?.letterhead_url

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Letters & Documents</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>
        AI-generated official letters on your masjid letterhead
      </p>

      {missingProfile && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: '#92400e' }}>
          ⚠ Your masjid logo or letterhead is not uploaded yet. Letters will use a plain header.{' '}
          <Link href="/settings/profile" style={{ color: '#92400e', fontWeight: 700 }}>Upload now →</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
        {LETTER_TYPES.map(lt => (
          <Link key={lt.id} href={lt.href}
            style={{ background: 'white', borderRadius: 14, padding: 24, textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10, transition: 'box-shadow 0.15s', border: '1px solid var(--color-neutral-light)' }}>
            <span style={{ fontSize: 32 }}>{lt.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 4 }}>{lt.title}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{lt.desc}</div>
            </div>
            <div style={{ color: 'var(--color-primary-green)', fontSize: 13, fontWeight: 600, marginTop: 'auto' }}>Generate →</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
