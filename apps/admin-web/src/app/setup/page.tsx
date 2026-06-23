import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { saveSetupStep } from './actions'
import { SRI_LANKA_DISTRICTS } from '@masjidhub/config'

const STEPS = [
  { num: 1, label: 'Basic Info'  },
  { num: 2, label: 'Location'    },
  { num: 3, label: 'Contact'     },
  { num: 4, label: 'Branding'    },
  { num: 5, label: 'Banking'     },
  { num: 6, label: 'Leadership'  },
]

export default async function SetupPage({
  searchParams,
}: { searchParams: { step?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mu } = await supabase
    .from('masjid_users')
    .select('masjid_id')
    .eq('user_id', user.id)
    .eq('role', 'masjid_admin')
    .single()

  if (!mu) redirect('/login')

  const { data: masjid } = await supabase
    .from('masjids')
    .select('*')
    .eq('id', mu.masjid_id)
    .single()

  if (!masjid) redirect('/login')
  if (masjid.profile_complete) redirect('/dashboard')

  // Resume from saved step unless URL specifies one
  const savedStep = masjid.setup_step ?? 1
  const step      = Math.min(6, Math.max(1, Number(searchParams.step ?? savedStep)))

  const action = saveSetupStep.bind(null, step)

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48, paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1a7a4a' }}>MasjidHub LK</div>
        <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Set up your masjid profile</div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <a href={s.num <= savedStep ? `/setup?step=${s.num}` : undefined as any}
                style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  background: step === s.num ? '#1a7a4a' : s.num < step ? '#86efac' : '#e5e7eb',
                  color: step === s.num ? 'white' : s.num < step ? '#166534' : '#9ca3af',
                  cursor: s.num <= savedStep ? 'pointer' : 'default',
                }}>
                {s.num < step ? '✓' : s.num}
              </a>
              <span style={{ fontSize: 10, color: step === s.num ? '#1a7a4a' : '#9ca3af', marginTop: 4, fontWeight: step === s.num ? 700 : 400, whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 48, height: 2, background: step > s.num ? '#86efac' : '#e5e7eb', margin: '0 4px', marginBottom: 20 }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 580, background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <form action={action} encType="multipart/form-data">
          {step === 1 && <Step1 masjid={masjid} />}
          {step === 2 && <Step2 masjid={masjid} />}
          {step === 3 && <Step3 masjid={masjid} />}
          {step === 4 && <Step4 masjid={masjid} />}
          {step === 5 && <Step5 masjid={masjid} />}
          {step === 6 && <Step6 masjid={masjid} />}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
            {step > 1
              ? <a href={`/setup?step=${step - 1}`} style={backBtn}>← Back</a>
              : <div />
            }
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" name="_action" value="save" style={saveBtn}>
                Save & Continue Later
              </button>
              <button type="submit" name="_action" value="next" style={nextBtn}>
                {step === 6 ? 'Complete Setup ✓' : 'Next →'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: '#9ca3af' }}>
        Your progress is saved automatically. You can continue anytime.
      </p>
    </div>
  )
}

// ── Step components ───────────────────────────────────────────────────────────

function Step1({ masjid }: { masjid: any }) {
  return (
    <>
      <StepHeader title="Basic Information" sub="Tell us about your masjid" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Masjid Name *">
          <input name="name" required style={inp} defaultValue={masjid.name ?? ''} placeholder="e.g. Masjid Al-Noor" />
        </Field>
        <Field label="Masjid Type *">
          <select name="type" required style={inp} defaultValue={masjid.type ?? 'jumma_masjid'}>
            <option value="jumma_masjid">Jumma Masjid</option>
            <option value="madrasa">Madrasa</option>
            <option value="community_masjid">Community Masjid</option>
            <option value="jamiyath">Jamiyath</option>
          </select>
        </Field>
        <Field label="Registration Number (if any)">
          <input name="registration_number" style={inp} defaultValue={masjid.registration_number ?? ''} placeholder="e.g. MA/WP/2019/1234" />
        </Field>
      </div>
    </>
  )
}

function Step2({ masjid }: { masjid: any }) {
  return (
    <>
      <StepHeader title="Location" sub="Where is your masjid located?" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="District *">
          <select name="district" required style={inp} defaultValue={masjid.district ?? ''}>
            <option value="">Select district…</option>
            {SRI_LANKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Full Address *">
          <textarea name="address" required rows={3} style={{ ...inp, resize: 'vertical' }}
            defaultValue={masjid.address ?? ''}
            placeholder="No. 12, Main Street, Wellawatte, Colombo 06" />
        </Field>
        <Field label="Website (optional)">
          <input name="website" type="url" style={inp} defaultValue={masjid.website ?? ''} placeholder="https://masjidalnoor.lk" />
        </Field>
      </div>
    </>
  )
}

function Step3({ masjid }: { masjid: any }) {
  return (
    <>
      <StepHeader title="Contact Details" sub="How can members and the public reach you?" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={grid2}>
          <Field label="Phone *">
            <input name="phone" type="tel" required style={inp} defaultValue={masjid.phone ?? ''} placeholder="011 234 5678" />
          </Field>
          <Field label="Mobile *">
            <input name="mobile" type="tel" required style={inp} defaultValue={masjid.mobile ?? ''} placeholder="077 123 4567" />
          </Field>
        </div>
        <Field label="Email Address">
          <input name="email" type="email" style={inp} defaultValue={masjid.email ?? ''} placeholder="info@masjidalnoor.lk" />
        </Field>
      </div>
    </>
  )
}

function Step4({ masjid }: { masjid: any }) {
  return (
    <>
      <StepHeader title="Logo & Letterhead" sub="Used on receipts, letters, and AI-generated documents" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <Field label="Masjid Logo">
            {masjid.logo_url && (
              <img src={masjid.logo_url} alt="Current logo" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 8, padding: 4 }} />
            )}
            <input name="logo" type="file" accept="image/*" style={{ fontSize: 13 }} />
            <p style={hint}>PNG or JPG, transparent background preferred. Used as the masjid seal on all documents.</p>
          </Field>
        </div>
        <div>
          <Field label="Official Letterhead (Scan or Image)">
            {masjid.letterhead_url && (
              <img src={masjid.letterhead_url} alt="Current letterhead" style={{ width: '100%', maxHeight: 100, objectFit: 'cover', marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 8 }} />
            )}
            <input name="letterhead" type="file" accept="image/*,.pdf" style={{ fontSize: 13 }} />
            <p style={hint}>Scan the top portion of your official letterhead. AI will use this as the header on generated letters.</p>
          </Field>
        </div>
        {!masjid.logo_url && !masjid.letterhead_url && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 12, fontSize: 12, color: '#166534' }}>
            💡 You can skip uploads now and add them later from Settings. Documents will use a default header until you upload.
          </div>
        )}
      </div>
    </>
  )
}

function Step5({ masjid }: { masjid: any }) {
  return (
    <>
      <StepHeader title="Banking Details" sub="Printed on receipts and payment slips" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Bank Name">
          <input name="bank_name" style={inp} defaultValue={masjid.bank_name ?? ''} placeholder="e.g. Bank of Ceylon" />
        </Field>
        <div style={grid2}>
          <Field label="Account Number">
            <input name="bank_account" style={inp} defaultValue={masjid.bank_account ?? ''} placeholder="0000 0000 0000" />
          </Field>
          <Field label="Branch">
            <input name="bank_branch" style={inp} defaultValue={masjid.bank_branch ?? ''} placeholder="e.g. Wellawatte" />
          </Field>
        </div>
        <p style={hint}>Bank details appear on receipts and member fee collection slips. Leave blank if not applicable.</p>
      </div>
    </>
  )
}

function Step6({ masjid }: { masjid: any }) {
  return (
    <>
      <StepHeader title="Leadership" sub="Names used on official letters and documents" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Imam / Head Moulavi">
          <input name="imam_name" style={inp} defaultValue={masjid.imam_name ?? ''} placeholder="e.g. Moulana Mohamed Ismail" />
        </Field>
        <Field label="Secretary">
          <input name="secretary_name" style={inp} defaultValue={masjid.secretary_name ?? ''} placeholder="e.g. Br. Ahmed Farook" />
        </Field>
        <Field label="Chairperson / President">
          <input name="chairperson_name" style={inp} defaultValue={masjid.chairperson_name ?? ''} placeholder="e.g. Br. Hassan Ibrahim" />
        </Field>
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 14, fontSize: 13, color: '#166534' }}>
          🎉 You're almost done! Click <strong>Complete Setup</strong> to enter your dashboard.
        </div>
      </div>
    </>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: 14, color: '#6b7280' }}>{sub}</p>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const inp: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 14, width: '100%', background: 'white', color: '#111' }
const hint: React.CSSProperties = { fontSize: 11, color: '#9ca3af', marginTop: 4 }
const backBtn: React.CSSProperties = { color: '#6b7280', fontSize: 14, textDecoration: 'none', padding: '10px 4px' }
const saveBtn: React.CSSProperties = { background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer' }
const nextBtn: React.CSSProperties = { background: '#1a7a4a', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }
