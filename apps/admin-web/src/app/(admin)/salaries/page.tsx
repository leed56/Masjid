import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLKR } from '@masjidhub/utils'
import { MONTH_NAMES } from '@masjidhub/config'

const ROLE_LABELS: Record<string, string> = {
  head_moulavi:       'Head Moulavi',
  muazzin:            'Muazzin',
  assistant_moulavi:  'Asst. Moulavi',
  madarsa_teacher:    'Madarsa Teacher',
  cleaner:            'Cleaner',
  security:           'Security',
  office_helper:      'Office Helper',
  ramadan_temp:       'Ramadan Staff',
  guest_speaker:      'Guest Speaker',
}

export default async function SalariesPage({
  searchParams,
}: { searchParams: { year?: string; month?: string } }) {
  const supabase = await createClient()
  const now   = new Date()
  const year  = Number(searchParams.year  ?? now.getFullYear())
  const month = Number(searchParams.month ?? now.getMonth() + 1)

  const [{ data: staff }, { data: salaries }, { data: masjids }, { data: funds }] = await Promise.all([
    supabase.from('staff').select('*').eq('status', 'active').order('role'),
    supabase.from('staff_salaries').select('*').eq('year', year).eq('month', month),
    supabase.from('masjids').select('id, name').eq('status', 'active'),
    supabase.from('funds').select('id, name, masjid_id').eq('status', 'active'),
  ])

  const paidIds = new Set((salaries ?? []).filter(s => s.paid).map(s => s.staff_id))
  const totalPaid = (salaries ?? []).filter(s => s.paid).reduce((sum, s) => sum + s.net_paid, 0)
  const unpaidStaff = (staff ?? []).filter(s => !paidIds.has(s.id))

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Salaries — {monthLabel}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <MonthNav year={year} month={month} />
          <Link href="/salaries/staff/add" style={actionBtn}>+ Add Staff</Link>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Staff"     value={(staff ?? []).length}   color="var(--color-deep-teal)" />
        <StatCard label="Paid This Month" value={paidIds.size}           color="var(--color-success)" />
        <StatCard label="Total Paid (LKR)"value={formatLKR(totalPaid)}   color="var(--color-primary-green)" />
      </div>

      {/* Unpaid staff */}
      {unpaidStaff.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: 'var(--color-danger)' }}>
            Pending Payment ({unpaidStaff.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unpaidStaff.map(s => (
              <div key={s.id} style={{ background: 'white', borderRadius: 10, padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.full_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{ROLE_LABELS[s.role] ?? s.role}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{formatLKR(s.salary_amount)}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.salary_cycle}</div>
                  </div>
                  <Link
                    href={`/salaries/pay/${s.id}?year=${year}&month=${month}`}
                    style={{ background: 'var(--color-primary-green)', color: 'white', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
                  >
                    Pay Salary
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paid staff */}
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
        Paid ({paidIds.size})
      </div>
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--color-light-cream)' }}>
              {['Staff','Role','Basic','Allowance','Deduction','Bonus','Net Paid','Date','Method'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(salaries ?? []).filter(s => s.paid).map((s, i) => {
              const member = (staff ?? []).find(st => st.id === s.staff_id)
              return (
                <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid var(--color-neutral-light)' : undefined }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{member?.full_name ?? '—'}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-secondary)' }}>{ROLE_LABELS[member?.role ?? ''] ?? member?.role}</td>
                  <td style={{ padding: '10px 16px' }}>{formatLKR(s.basic_salary)}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-success)' }}>{formatLKR(s.allowance)}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-danger)' }}>{formatLKR(s.advance_deduction)}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-success)' }}>{formatLKR(s.bonus)}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 700 }}>{formatLKR(s.net_paid)}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-secondary)' }}>{s.paid_date ?? '—'}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-secondary)' }}>{s.method ?? '—'}</td>
                </tr>
              )
            })}
            {paidIds.size === 0 && (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>No salaries paid for {monthLabel} yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MonthNav({ year, month }: { year: number; month: number }) {
  const prev = month === 1  ? `/salaries?year=${year - 1}&month=12` : `/salaries?year=${year}&month=${month - 1}`
  const next = month === 12 ? `/salaries?year=${year + 1}&month=1`  : `/salaries?year=${year}&month=${month + 1}`
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <Link href={prev} style={navBtn}>‹</Link>
      <Link href={next} style={navBtn}>›</Link>
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

const actionBtn: React.CSSProperties = { background: 'var(--color-primary-green)', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }
const navBtn: React.CSSProperties = { background: 'white', border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '9px 14px', textDecoration: 'none', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: 15 }
