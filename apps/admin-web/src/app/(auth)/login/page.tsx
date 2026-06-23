'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-light-cream)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 40,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{ color: 'var(--color-primary-green)', marginBottom: 8, fontSize: 24 }}>
          MasjidHub LK
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>
          Admin Dashboard
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--color-neutral-light)',
  borderRadius: 8,
  fontSize: 15,
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  background: 'var(--color-primary-green)',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  padding: '12px',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 8,
}
