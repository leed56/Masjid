'use client'

import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function TopHeader({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header style={{
      height: 56,
      background: 'white',
      borderBottom: '1px solid var(--color-neutral-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
        {/* Masjid switcher placeholder */}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none',
            border: '1px solid var(--color-neutral-light)',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
