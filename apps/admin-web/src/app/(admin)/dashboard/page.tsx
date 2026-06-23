import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatCard } from '@/components/ui/StatCard'
import { formatLKR, formatDate } from '@masjidhub/utils'

export default async function DashboardPage() {
  const supabase = await createClient()

  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  const [
    { count: totalMembers },
    { count: pendingSlips },
    { count: unpaidCount },
    { data: funds },
    { data: recentPayments },
    { data: recentExpenses },
    { data: pendingExpenses },
  ] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('member_monthly_fees').select('*', { count: 'exact', head: true }).in('status', ['unpaid','overdue']).eq('year', year).eq('month', month),
    supabase.from('funds').select('name, current_balance, type, is_restricted').eq('status', 'active').order('current_balance', { ascending: false }),
    supabase.from('payments').select('amount, method, payment_date, status, members(full_name)').eq('status', 'approved').order('created_at', { ascending: false }).limit(5),
    supabase.from('expenses').select('amount, category, expense_date, status').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
    supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('status', 'pending').is('deleted_at', null),
  ])

  const totalFundBalance = (funds ?? []).reduce((s, f) => s + f.current_balance, 0)

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Active Members"     value={totalMembers ?? 0}          color="var(--color-primary-green)" />
        <StatCard label="Pending Slips"      value={pendingSlips ?? 0}          color="var(--color-warning)" />
        <StatCard label="Unpaid This Month"  value={unpaidCount ?? 0}           color="var(--color-danger)" />
        <StatCard label="Total Fund Balance" value={formatLKR(totalFundBalance)} color="var(--color-deep-teal)" />
        <StatCard label="Pending Expenses"   value={(pendingExpenses as any)?.count ?? 0} color="var(--color-warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Fund balances */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Fund Balances</div>
            <Link href="/funds" style={{ fontSize: 13, color: 'var(--color-primary-green)' }}>Manage →</Link>
          </div>
          {(funds ?? []).slice(0, 6).map(f => (
            <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-neutral-light)', fontSize: 14 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {f.name}
                {f.is_restricted && <span style={{ marginLeft: 6, fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 999, fontWeight: 700 }}>R</span>}
              </span>
              <span style={{ fontWeight: 600, color: f.current_balance >= 0 ? 'var(--color-primary-green)' : 'var(--color-danger)' }}>
                {formatLKR(f.current_balance)}
              </span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: '+ Member',        href: '/members/add',        color: 'var(--color-primary-green)' },
              { label: 'Collect Payment', href: '/payments/collect',   color: 'var(--color-deep-teal)' },
              { label: 'Review Slips',    href: '/slips',              color: 'var(--color-warning)' },
              { label: '+ Expense',       href: '/expenses/add',       color: 'var(--color-danger)' },
              { label: 'Unpaid Members',  href: '/members/unpaid',     color: 'var(--color-danger)' },
              { label: 'Generate Fees',   href: '/members/fees',       color: 'var(--color-deep-teal)' },
              { label: '+ Announcement',  href: '/announcements/add',  color: 'var(--color-primary-green)' },
              { label: 'Pay Salaries',    href: '/salaries',           color: 'var(--color-primary-green)' },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{ background: a.color, color: 'white', padding: '10px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent payments */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Recent Payments</div>
            <Link href="/payments" style={{ fontSize: 13, color: 'var(--color-primary-green)' }}>View all →</Link>
          </div>
          {(recentPayments ?? []).map((p, i) => {
            const m = p.members as { full_name: string } | null
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-neutral-light)', fontSize: 14 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{m?.full_name ?? '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{formatDate(p.payment_date)}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary-green)' }}>{formatLKR(p.amount)}</div>
              </div>
            )
          })}
          {!recentPayments?.length && <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>No payments yet.</p>}
        </div>

        {/* Recent expenses */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Recent Expenses</div>
            <Link href="/expenses" style={{ fontSize: 13, color: 'var(--color-primary-green)' }}>View all →</Link>
          </div>
          {(recentExpenses ?? []).map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-neutral-light)', fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{e.category.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{formatDate(e.expense_date)}</div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{formatLKR(e.amount)}</div>
            </div>
          ))}
          {!recentExpenses?.length && <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>No expenses yet.</p>}
        </div>
      </div>
    </div>
  )
}
