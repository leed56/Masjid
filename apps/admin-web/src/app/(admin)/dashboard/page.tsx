import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/StatCard'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch summary counts — replace with actual masjid_id from session
  const [
    { count: totalMembers },
    { count: pendingSlips },
    { count: unpaidCount },
  ] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('member_monthly_fees').select('*', { count: 'exact', head: true }).in('status', ['unpaid','overdue']),
  ])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Members"   value={totalMembers ?? 0} color="var(--color-primary-green)" />
        <StatCard label="Pending Slips"   value={pendingSlips ?? 0} color="var(--color-warning)" />
        <StatCard label="Unpaid This Month" value={unpaidCount ?? 0} color="var(--color-danger)" />
      </div>

      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
        Select a masjid from the header switcher to see full dashboard data.
      </p>
    </div>
  )
}
