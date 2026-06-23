'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { generateRecommendationLetter } from '../actions'

export default function RecommendationLetterPage() {
  const [html, setHtml]       = useState('')
  const [error, setError]     = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError('')
    startTransition(async () => {
      const result = await generateRecommendationLetter(formData)
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
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 4px' }}>Recommendation Letter</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>Fill in the details — AI will draft the letter on your masjid letterhead</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Member Being Recommended">
          <Field label="Member Full Name *"><input name="member_name" required style={inp} placeholder="e.g. Mohamed Ismail s/o Abdul Hameed" /></Field>
          <Field label="Member Address"><textarea name="member_address" rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="No. 12, Main Street, Colombo 06" /></Field>
          <Field label="Member Since / Duration"><input name="duration" style={inp} placeholder="e.g. Registered member since 2018 (6 years)" /></Field>
        </Card>

        <Card title="Letter Details">
          <Field label="Purpose of Letter *"><input name="purpose" required style={inp} placeholder="e.g. Visa application / Job application / Bank loan" /></Field>
          <Field label="Addressed To (optional)"><input name="recipient_name" style={inp} placeholder="e.g. The Visa Officer, Embassy of UAE" /></Field>
          <Field label="Additional Notes for AI"><textarea name="extra_notes" rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Any specific points to mention — e.g. active volunteer, committee member…" /></Field>
        </Card>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

        <button type="submit" disabled={pending} style={{ ...submitBtn, opacity: pending ? 0.7 : 1 }}>
          {pending ? 'Generating…' : '✨ Generate Letter'}
        </button>
      </form>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-deep-teal)', marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
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
