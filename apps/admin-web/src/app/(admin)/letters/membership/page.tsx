'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { generateMembershipLetter } from '../actions'

export default function MembershipLetterPage() {
  const [html, setHtml]   = useState('')
  const [error, setError] = useState('')
  const [pending, start]  = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const result = await generateMembershipLetter(fd)
      if (result.error) setError(result.error)
      else setHtml(result.html)
    })
  }

  if (html) {
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button onClick={() => setHtml('')} style={backBtn}>← Edit Details</button>
          <button onClick={() => {
            const w = window.open('', '_blank')
            w?.document.write(html)
            w?.document.close()
            setTimeout(() => w?.print(), 500)
          }} style={printBtn}>🖨 Print / Save PDF</button>
        </div>
        <iframe srcDoc={html} style={{ width: '100%', height: 'calc(100vh - 80px)', border: 'none', borderRadius: 10 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/letters" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Letters</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 4px' }}>Membership Attestation Letter</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Confirms the person is a registered member of your masjid community
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Member Full Name *"><input name="member_name" required style={inp} placeholder="e.g. Fathima Ismail d/o Mohamed Ali" /></Field>
          <Field label="Member ID (optional)"><input name="member_id" style={inp} placeholder="e.g. MH-001" /></Field>
          <Field label="Member Address"><textarea name="member_address" rows={2} style={{ ...inp, resize: 'vertical' }} /></Field>
          <Field label="Purpose *"><input name="purpose" required style={inp} placeholder="e.g. Visa application / School admission / Government form" /></Field>
          <Field label="Addressed To (optional)"><input name="recipient_name" style={inp} placeholder="e.g. The Principal, XYZ School" /></Field>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

        <button type="submit" disabled={pending} style={{ ...submitBtn, opacity: pending ? 0.7 : 1 }}>
          {pending ? 'Generating…' : '✨ Generate Letter'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}
const inp: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 12px', fontSize: 14, width: '100%', background: 'white' }
const submitBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const backBtn: React.CSSProperties = { background: 'white', color: 'var(--color-text-secondary)', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 16px', fontSize: 14, cursor: 'pointer' }
const printBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }
