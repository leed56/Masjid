'use client'

import { useTransition } from 'react'
import { SRI_LANKA_DISTRICTS } from '@masjidhub/config'

interface MemberFormProps {
  action: (formData: FormData) => Promise<void>
  masjids: { id: string; name: string; default_monthly_fee: number }[]
  families: { id: string; family_name: string; area: string }[]
  defaultValues?: Record<string, unknown>
}

export function MemberForm({ action, masjids, families, defaultValues: dv }: MemberFormProps) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
      <Section title="Masjid & Identity">
        <div style={grid2}>
          <Field label="Masjid *" name="masjid_id" required>
            <select name="masjid_id" required style={input} defaultValue={dv?.masjid_id as string ?? ''}>
              <option value="">Select masjid</option>
              {masjids.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Member Code *" name="member_code" required>
            <input name="member_code" required style={input} defaultValue={dv?.member_code as string ?? ''} placeholder="e.g. M-0001" />
          </Field>
          <Field label="Full Name *" name="full_name" required>
            <input name="full_name" required style={input} defaultValue={dv?.full_name as string ?? ''} />
          </Field>
          <Field label="Gender" name="gender">
            <select name="gender" style={input} defaultValue={dv?.gender as string ?? ''}>
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="NIC" name="nic">
            <input name="nic" style={input} defaultValue={dv?.nic as string ?? ''} />
          </Field>
          <Field label="Occupation" name="occupation">
            <input name="occupation" style={input} defaultValue={dv?.occupation as string ?? ''} />
          </Field>
        </div>
      </Section>

      <Section title="Contact">
        <div style={grid2}>
          <Field label="Phone" name="phone">
            <input name="phone" type="tel" style={input} defaultValue={dv?.phone as string ?? ''} placeholder="+94 77 xxx xxxx" />
          </Field>
          <Field label="WhatsApp" name="whatsapp">
            <input name="whatsapp" type="tel" style={input} defaultValue={dv?.whatsapp as string ?? ''} />
          </Field>
          <Field label="Email" name="email">
            <input name="email" type="email" style={input} defaultValue={dv?.email as string ?? ''} />
          </Field>
        </div>
      </Section>

      <Section title="Address">
        <div style={grid2}>
          <Field label="Address *" name="address" required style={{ gridColumn: '1 / -1' }}>
            <input name="address" required style={input} defaultValue={dv?.address as string ?? ''} />
          </Field>
          <Field label="Area / Street *" name="area" required>
            <input name="area" required style={input} defaultValue={dv?.area as string ?? ''} />
          </Field>
          <Field label="District" name="district">
            <select name="district" style={input} defaultValue={dv?.district as string ?? ''}>
              <option value="">—</option>
              {SRI_LANKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Family">
        <div style={grid2}>
          <Field label="Family" name="family_id">
            <select name="family_id" style={input} defaultValue={dv?.family_id as string ?? ''}>
              <option value="">None / Individual</option>
              {families.map(f => <option key={f.id} value={f.id}>{f.family_name} — {f.area}</option>)}
            </select>
          </Field>
          <Field label="Family Members Count" name="family_members_count">
            <input name="family_members_count" type="number" min={1} style={input} defaultValue={dv?.family_members_count as number ?? ''} />
          </Field>
        </div>
      </Section>

      <Section title="Fee & Status">
        <div style={grid2}>
          <Field label="Monthly Fee (LKR) *" name="monthly_fee_amount" required>
            <input name="monthly_fee_amount" type="number" min={0} step={50} required style={input} defaultValue={dv?.monthly_fee_amount as number ?? 500} />
          </Field>
          <Field label="Fee Category *" name="fee_category" required>
            <select name="fee_category" required style={input} defaultValue={dv?.fee_category as string ?? 'standard'}>
              <option value="standard">Standard</option>
              <option value="reduced">Reduced</option>
              <option value="exempted">Exempted</option>
              <option value="sponsored">Sponsored</option>
            </select>
          </Field>
          <Field label="Status *" name="status" required>
            <select name="status" required style={input} defaultValue={dv?.status as string ?? 'active'}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="moved">Moved</option>
              <option value="deceased">Deceased</option>
              <option value="exempted">Exempted</option>
            </select>
          </Field>
          <Field label="Registered Date *" name="registered_date" required>
            <input
              name="registered_date"
              type="date"
              required
              style={input}
              defaultValue={dv?.registered_date as string ?? new Date().toISOString().split('T')[0]}
            />
          </Field>
        </div>
      </Section>

      <Section title="Notes">
        <textarea
          name="notes"
          style={{ ...input, height: 80, resize: 'vertical' }}
          defaultValue={dv?.notes as string ?? ''}
          placeholder="Optional notes about this member"
        />
      </Section>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button type="submit" disabled={pending} style={submitBtn}>
          {pending ? 'Saving…' : 'Save Member'}
        </button>
        <a href="/members" style={{ ...cancelBtn }}>Cancel</a>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14, color: 'var(--color-deep-teal)' }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, name, required, children, style }: {
  label: string; name: string; required?: boolean; children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      <label htmlFor={name} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const input: React.CSSProperties = {
  border: '1px solid var(--color-neutral-light)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 14,
  width: '100%',
  background: 'white',
  outline: 'none',
}
const submitBtn: React.CSSProperties = {
  background: 'var(--color-primary-green)',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  padding: '12px 28px',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
}
const cancelBtn: React.CSSProperties = {
  background: 'white',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-neutral-light)',
  borderRadius: 8,
  padding: '12px 24px',
  fontSize: 15,
  textDecoration: 'none',
  display: 'inline-block',
}
