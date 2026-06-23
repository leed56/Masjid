import { createClient } from '@/lib/supabase/server'
import { formatLKR } from '@masjidhub/utils'
import { createFund, transferFunds } from './actions'

const FUND_TYPE_LABELS: Record<string, string> = {
  monthly_fee:      'Monthly Fee',
  ramadan:          'Ramadan',
  development:      'Development',
  well_wisher:      'Well-Wisher',
  madarsa:          'Madarsa',
  janaza_support:   'Janaza Support',
  zakat:            'Zakat',
  sadaqah:          'Sadaqah',
  utility:          'Utility',
  jumma_guest:      'Jumma Guest',
  general_donation: 'General Donation',
}

export default async function FundsPage() {
  const supabase = await createClient()

  const [{ data: funds }, { data: masjids }] = await Promise.all([
    supabase.from('funds').select('*').eq('status', 'active').order('name'),
    supabase.from('masjids').select('id, name').eq('status', 'active'),
  ])

  const totalBalance = (funds ?? []).reduce((s, f) => s + f.current_balance, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Funds</h1>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary-green)' }}>
          Total: {formatLKR(totalBalance)}
        </div>
      </div>

      {/* Fund balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 32 }}>
        {(funds ?? []).map(f => (
          <div key={f.id} style={{
            background: 'white', borderRadius: 12, padding: '18px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            borderLeft: `4px solid ${f.is_restricted ? 'var(--color-gold)' : 'var(--color-primary-green)'}`,
          }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              {FUND_TYPE_LABELS[f.type] ?? f.type}
              {f.is_restricted && <span style={{ marginLeft: 6, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>RESTRICTED</span>}
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{f.name}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: f.current_balance >= 0 ? 'var(--color-primary-green)' : 'var(--color-danger)' }}>
              {formatLKR(f.current_balance)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Opening: {formatLKR(f.opening_balance)}
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                background: f.visibility === 'public' ? '#dcfce7' : '#f3f4f6',
                color: f.visibility === 'public' ? '#166534' : '#6b7280',
              }}>
                {f.visibility}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Add Fund */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: 'var(--color-deep-teal)' }}>Add New Fund</div>
          <form action={createFund} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={row}>
              <label style={lbl}>Masjid *</label>
              <select name="masjid_id" required style={inp}>
                {(masjids ?? []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div style={row}>
              <label style={lbl}>Fund Name *</label>
              <input name="name" required style={inp} placeholder="e.g. Building Renovation Fund" />
            </div>
            <div style={row}>
              <label style={lbl}>Type *</label>
              <select name="type" required style={inp}>
                {Object.entries(FUND_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={row}>
              <label style={lbl}>Opening Balance (LKR)</label>
              <input name="opening_balance" type="number" min={0} step={100} style={inp} defaultValue={0} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={row}>
                <label style={lbl}>Visibility</label>
                <select name="visibility" style={inp}>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div style={row}>
                <label style={lbl}>Restricted?</label>
                <select name="is_restricted" style={inp}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
            <button type="submit" style={submitBtn}>Create Fund</button>
          </form>
        </div>

        {/* Transfer Between Funds */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: 'var(--color-deep-teal)' }}>Transfer Between Funds</div>
          <form action={transferFunds} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="hidden" name="masjid_id" value={masjids?.[0]?.id ?? ''} />
            <div style={row}>
              <label style={lbl}>From Fund *</label>
              <select name="from_fund_id" required style={inp}>
                <option value="">Select fund…</option>
                {(funds ?? []).map(f => (
                  <option key={f.id} value={f.id}>{f.name} — {formatLKR(f.current_balance)}</option>
                ))}
              </select>
            </div>
            <div style={row}>
              <label style={lbl}>To Fund *</label>
              <select name="to_fund_id" required style={inp}>
                <option value="">Select fund…</option>
                {(funds ?? []).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div style={row}>
              <label style={lbl}>Amount (LKR) *</label>
              <input name="amount" type="number" min={1} step={100} required style={inp} />
            </div>
            <div style={row}>
              <label style={lbl}>Notes</label>
              <input name="notes" style={inp} placeholder="Reason for transfer" />
            </div>
            <button type="submit" style={{ ...submitBtn, background: 'var(--color-deep-teal)' }}>Transfer</button>
          </form>
        </div>
      </div>
    </div>
  )
}

const row: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 }
const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }
const inp: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 12px', fontSize: 14, width: '100%', background: 'white' }
const submitBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }
