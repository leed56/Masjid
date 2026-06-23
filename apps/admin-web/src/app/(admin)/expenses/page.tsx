import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, formatLKR } from '@masjidhub/utils'
import { approveExpense, softDeleteExpense } from './actions'

const CATEGORY_LABELS: Record<string, string> = {
  head_moulavi_salary:      'Head Moulavi Salary',
  muazzin_salary:           'Muazzin Salary',
  assistant_moulavi_salary: 'Asst. Moulavi Salary',
  madarsa_teacher_salary:   'Madarsa Teacher Salary',
  cleaner_salary:           'Cleaner Salary',
  security_salary:          'Security Salary',
  electricity:              'Electricity',
  water:                    'Water',
  internet:                 'Internet',
  sound_system:             'Sound System',
  carpet:                   'Carpet',
  ac_fan_repair:            'AC/Fan Repair',
  building_maintenance:     'Building Maintenance',
  wudu_toilet_maintenance:  'Wudu/Toilet Maintenance',
  ramadan_iftar:            'Ramadan Iftar',
  taraweeh_program:         'Taraweeh Program',
  jumma_guest_payment:      'Jumma Guest Payment',
  janaza_support:           'Janaza Support',
  printing_stationery:      'Printing/Stationery',
  bank_charges:             'Bank Charges',
  development_construction: 'Development/Construction',
  other:                    'Other',
}

export default async function ExpensesPage({
  searchParams,
}: { searchParams: { status?: string } }) {
  const supabase = await createClient()

  let query = supabase
    .from('expenses')
    .select('*, funds(name)')
    .is('deleted_at', null)
    .order('expense_date', { ascending: false })
    .limit(100)

  if (searchParams.status) query = query.eq('status', searchParams.status)

  const [{ data: expenses }, { data: funds }, { data: masjids }] = await Promise.all([
    query,
    supabase.from('funds').select('id, name, masjid_id').eq('status', 'active'),
    supabase.from('masjids').select('id, name').eq('status', 'active'),
  ])

  const totalApproved = (expenses ?? [])
    .filter(e => e.status === 'approved' || e.status === 'paid')
    .reduce((s, e) => s + e.amount, 0)

  const pendingCount = (expenses ?? []).filter(e => e.status === 'pending').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Expenses</h1>
        <Link href="/expenses/add" style={actionBtn}>+ Add Expense</Link>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Approved (LKR)" value={formatLKR(totalApproved)} color="var(--color-danger)" />
        <StatCard label="Pending Approval"      value={pendingCount}             color="var(--color-warning)" />
        <StatCard label="All Expenses"          value={(expenses ?? []).length}  color="var(--color-deep-teal)" />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['All','pending','approved','paid','rejected','draft'].map(s => (
          <Link key={s} href={s === 'All' ? '/expenses' : `/expenses?status=${s}`} style={chip}>{s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</Link>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--color-light-cream)' }}>
              {['Date','Category','Fund','Amount','Paid To','Status','Bill','Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(expenses ?? []).map((e, i) => {
              const fund = e.funds as { name: string } | null
              return (
                <tr key={e.id} style={{ borderTop: i > 0 ? '1px solid var(--color-neutral-light)' : undefined }}>
                  <td style={td}>{formatDate(e.expense_date)}</td>
                  <td style={td}>{CATEGORY_LABELS[e.category] ?? e.category}</td>
                  <td style={td}>{fund?.name ?? '—'}</td>
                  <td style={{ ...td, fontWeight: 700, color: 'var(--color-danger)' }}>{formatLKR(e.amount)}</td>
                  <td style={{ ...td, color: 'var(--color-text-secondary)' }}>{e.paid_to ?? '—'}</td>
                  <td style={td}><StatusBadge status={e.status} /></td>
                  <td style={td}>
                    {e.bill_url
                      ? <a href={e.bill_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary-green)', fontSize: 12 }}>View ↗</a>
                      : <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {e.status === 'pending' && (
                        <form action={approveExpense.bind(null, e.id)}>
                          <button type="submit" style={{ fontSize: 12, background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                            Approve
                          </button>
                        </form>
                      )}
                      <form action={softDeleteExpense.bind(null, e.id)}>
                        <button type="submit" style={{ fontSize: 12, background: 'var(--color-light-cream)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!expenses?.length && (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No expenses found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    approved: { bg: '#dcfce7', text: '#166534' },
    paid:     { bg: '#d1fae5', text: '#065f46' },
    pending:  { bg: '#fef3c7', text: '#92400e' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
    draft:    { bg: '#f3f4f6', text: '#6b7280' },
  }
  const c = map[status] ?? { bg: '#f3f4f6', text: '#374151' }
  return <span style={{ background: c.bg, color: c.text, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{status}</span>
}

const td: React.CSSProperties = { padding: '12px 16px' }
const actionBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }
const chip: React.CSSProperties = { padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'white', border: '1px solid var(--color-neutral-light)', textDecoration: 'none', color: 'var(--color-text-primary)' }
