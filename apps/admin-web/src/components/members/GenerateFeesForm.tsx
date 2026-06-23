'use client'

import { useState, useTransition } from 'react'
import { generateMonthlyFees } from '@/app/(admin)/members/actions'
import { MONTH_NAMES } from '@masjidhub/config'

interface Props {
  masjids: { id: string; name: string }[]
  year: number
  month: number
}

export function GenerateFeesForm({ masjids, year, month }: Props) {
  const [masjidId, setMasjidId] = useState(masjids[0]?.id ?? '')
  const [selYear, setSelYear]   = useState(year)
  const [selMonth, setSelMonth] = useState(month)
  const [result, setResult]     = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  function handleGenerate() {
    if (!masjidId) return
    startTransition(async () => {
      try {
        const res = await generateMonthlyFees(masjidId, selYear, selMonth)
        setResult(`Generated ${res.generated} fee records for ${MONTH_NAMES[selMonth - 1]} ${selYear}`)
      } catch (e) {
        setResult(`Error: ${(e as Error).message}`)
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={masjidId} onChange={e => setMasjidId(e.target.value)} style={sel}>
          {masjids.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} style={sel}>
          {MONTH_NAMES.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
        </select>
        <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} style={sel}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={handleGenerate} disabled={pending} style={btn}>
          {pending ? 'Generating…' : 'Generate Fees'}
        </button>
      </div>
      {result && <span style={{ fontSize: 13, color: result.startsWith('Error') ? 'var(--color-danger)' : 'var(--color-success)' }}>{result}</span>}
    </div>
  )
}

const sel: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '8px 12px', fontSize: 14, background: 'white' }
const btn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
