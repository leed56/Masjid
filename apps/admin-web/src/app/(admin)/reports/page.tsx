import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLKR, formatDate } from '@masjidhub/utils'
import { MONTH_NAMES } from '@masjidhub/config'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { report?: string; year?: string; month?: string; masjid_id?: string }
}) {
  const supabase    = await createClient()
  const now         = new Date()
  const report      = searchParams.report  ?? 'collection'
  const year        = Number(searchParams.year  ?? now.getFullYear())
  const month       = Number(searchParams.month ?? now.getMonth() + 1)

  const { data: masjids } = await supabase.from('masjids').select('id, name').eq('status', 'active')
  const masjidId = searchParams.masjid_id ?? masjids?.[0]?.id ?? ''

  // ── data per report type ──────────────────────────────────────────────────
  let collectionRows: any[]   = []
  let unpaidRows: any[]       = []
  let fundRows: any[]         = []
  let expenseRows: any[]      = []
  let salaryRows: any[]       = []
  let summaryCards: { label: string; value: string; color: string }[] = []

  if (report === 'collection' && masjidId) {
    const { data } = await supabase
      .from('payments')
      .select('id, amount, method, payment_date, status, members(full_name, member_id_number)')
      .eq('masjid_id', masjidId)
      .eq('status', 'approved')
      .gte('payment_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('payment_date', `${year}-${String(month).padStart(2, '0')}-31`)
      .order('payment_date', { ascending: false })
    collectionRows = data ?? []
    const total = collectionRows.reduce((s, r) => s + r.amount, 0)
    summaryCards = [
      { label: 'Total Collected', value: formatLKR(total),           color: 'var(--color-primary-green)' },
      { label: 'Payments',        value: String(collectionRows.length), color: 'var(--color-deep-teal)' },
    ]
  }

  if (report === 'unpaid' && masjidId) {
    const { data } = await supabase
      .from('member_monthly_fees')
      .select('year, month, amount_due, status, members(full_name, member_id_number, phone)')
      .eq('masjid_id', masjidId)
      .in('status', ['unpaid', 'overdue'])
      .eq('year', year)
      .eq('month', month)
      .order('members(full_name)')
    unpaidRows = data ?? []
    const totalDue = unpaidRows.reduce((s, r) => s + r.amount_due, 0)
    summaryCards = [
      { label: 'Unpaid Members', value: String(unpaidRows.length), color: 'var(--color-danger)' },
      { label: 'Total Due',      value: formatLKR(totalDue),       color: 'var(--color-warning)' },
    ]
  }

  if (report === 'funds' && masjidId) {
    const { data } = await supabase
      .from('funds')
      .select('name, type, current_balance, is_restricted, status')
      .eq('masjid_id', masjidId)
      .order('current_balance', { ascending: false })
    fundRows = data ?? []
    const total = fundRows.filter(f => f.status === 'active').reduce((s, f) => s + f.current_balance, 0)
    summaryCards = [
      { label: 'Total Balance', value: formatLKR(total),          color: 'var(--color-primary-green)' },
      { label: 'Active Funds',  value: String(fundRows.length),   color: 'var(--color-deep-teal)' },
    ]
  }

  if (report === 'expenses' && masjidId) {
    const { data } = await supabase
      .from('expenses')
      .select('amount, category, expense_date, paid_to, method, status, funds(name)')
      .eq('masjid_id', masjidId)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .gte('expense_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('expense_date', `${year}-${String(month).padStart(2, '0')}-31`)
      .order('expense_date', { ascending: false })
    expenseRows = data ?? []
    const total = expenseRows.reduce((s, r) => s + r.amount, 0)
    summaryCards = [
      { label: 'Total Expenses', value: formatLKR(total),             color: 'var(--color-danger)' },
      { label: 'Transactions',   value: String(expenseRows.length),   color: 'var(--color-warning)' },
    ]
  }

  if (report === 'salaries' && masjidId) {
    const { data } = await supabase
      .from('staff_salaries')
      .select('basic_salary, allowance, advance_deduction, bonus, net_paid, paid_date, staff(full_name, role)')
      .eq('masjid_id', masjidId)
      .eq('year', year)
      .eq('month', month)
      .order('paid_date', { ascending: false })
    salaryRows = data ?? []
    const total = salaryRows.reduce((s, r) => s + r.net_paid, 0)
    summaryCards = [
      { label: 'Total Salary Paid', value: formatLKR(total),          color: 'var(--color-deep-teal)' },
      { label: 'Staff Paid',        value: String(salaryRows.length), color: 'var(--color-primary-green)' },
    ]
  }

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`

  const REPORTS = [
    { id: 'collection', label: 'Monthly Collection' },
    { id: 'unpaid',     label: 'Unpaid Members'     },
    { id: 'funds',      label: 'Fund Balances'      },
    { id: 'expenses',   label: 'Expense Summary'    },
    { id: 'salaries',   label: 'Salary Summary'     },
  ]

  // Build CSV export URL
  const csvHref = `/reports/export?report=${report}&year=${year}&month=${month}&masjid_id=${masjidId}`

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Reports</h1>
        <a href={csvHref} style={exportBtn}>⬇ Export CSV</a>
      </div>

      {/* Report type tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {REPORTS.map(r => (
          <Link key={r.id}
            href={`/reports?report=${r.id}&year=${year}&month=${month}&masjid_id=${masjidId}`}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, textDecoration: 'none',
              background: report === r.id ? 'var(--color-deep-teal)' : 'white',
              color:      report === r.id ? 'white' : 'var(--color-text-secondary)',
              border:     '1px solid var(--color-neutral-light)',
            }}>
            {r.label}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input type="hidden" name="report" value={report} />
        <select name="masjid_id" style={sel} defaultValue={masjidId}>
          {(masjids ?? []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {report !== 'funds' && (
          <>
            <select name="month" style={sel} defaultValue={month}>
              {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select name="year" style={sel} defaultValue={year}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
        <button type="submit" style={filterBtn}>Apply</button>
      </form>

      {/* Summary cards */}
      {summaryCards.length > 0 && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          {summaryCards.map(c => (
            <div key={c.label} style={{ background: 'white', borderRadius: 12, padding: '16px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${c.color}`, minWidth: 160 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Monthly Collection ── */}
      {report === 'collection' && (
        <Table
          title={`Payment Collection — ${monthLabel}`}
          headers={['Member', 'ID', 'Date', 'Method', 'Amount']}
          rows={collectionRows.map(r => {
            const m = r.members as { full_name: string; member_id_number: string } | null
            return [m?.full_name ?? '—', m?.member_id_number ?? '—', formatDate(r.payment_date), r.method, formatLKR(r.amount)]
          })}
        />
      )}

      {/* ── Unpaid Members ── */}
      {report === 'unpaid' && (
        <Table
          title={`Unpaid Members — ${monthLabel}`}
          headers={['Member', 'ID', 'Phone', 'Amount Due', 'Status']}
          rows={unpaidRows.map(r => {
            const m = r.members as { full_name: string; member_id_number: string; phone: string } | null
            return [m?.full_name ?? '—', m?.member_id_number ?? '—', m?.phone ?? '—', formatLKR(r.amount_due), r.status]
          })}
        />
      )}

      {/* ── Fund Balances ── */}
      {report === 'funds' && (
        <Table
          title="Fund Balances"
          headers={['Fund', 'Type', 'Restricted', 'Status', 'Balance']}
          rows={fundRows.map(f => [
            f.name,
            f.type.replace(/_/g, ' '),
            f.is_restricted ? 'Yes' : 'No',
            f.status,
            formatLKR(f.current_balance),
          ])}
        />
      )}

      {/* ── Expenses ── */}
      {report === 'expenses' && (
        <Table
          title={`Approved Expenses — ${monthLabel}`}
          headers={['Date', 'Category', 'Fund', 'Paid To', 'Method', 'Amount']}
          rows={expenseRows.map(r => {
            const f = r.funds as { name: string } | null
            return [formatDate(r.expense_date), r.category.replace(/_/g, ' '), f?.name ?? '—', r.paid_to ?? '—', r.method ?? '—', formatLKR(r.amount)]
          })}
        />
      )}

      {/* ── Salaries ── */}
      {report === 'salaries' && (
        <Table
          title={`Salary Payments — ${monthLabel}`}
          headers={['Staff', 'Role', 'Basic', 'Allowance', 'Deduction', 'Bonus', 'Net Paid', 'Paid Date']}
          rows={salaryRows.map(r => {
            const st = r.staff as { full_name: string; role: string } | null
            return [
              st?.full_name ?? '—', st?.role?.replace(/_/g, ' ') ?? '—',
              formatLKR(r.basic_salary), formatLKR(r.allowance ?? 0),
              formatLKR(r.advance_deduction ?? 0), formatLKR(r.bonus ?? 0),
              formatLKR(r.net_paid), formatDate(r.paid_date),
            ]
          })}
        />
      )}
    </div>
  )
}

function Table({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: 'var(--color-deep-teal)' }}>{title}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-neutral-light)' }}>
              {headers.map(h => <th key={h} style={{ textAlign: 'left', padding: '9px 12px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={headers.length} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-secondary)' }}>No data for this period.</td></tr>
            )}
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-neutral-light)' }}>
                {row.map((cell, j) => <td key={j} style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const sel: React.CSSProperties = { border: '1px solid var(--color-neutral-light)', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: 'white' }
const filterBtn: React.CSSProperties = { background: 'var(--color-deep-teal)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }
const exportBtn: React.CSSProperties = { background: 'white', color: 'var(--color-deep-teal)', border: '1px solid var(--color-deep-teal)', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }
