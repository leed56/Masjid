import { createClient } from '@/lib/supabase/server'
import { recordCashPayment } from '../actions'
import { CollectForm } from '@/components/payments/CollectForm'

export default async function CollectPage({
  searchParams,
}: {
  searchParams: { member_id?: string; year?: string; month?: string }
}) {
  const supabase = await createClient()

  const [{ data: members }, { data: funds }, { data: masjids }] = await Promise.all([
    supabase.from('members').select('id, full_name, member_code, area, monthly_fee_amount, masjid_id').eq('status', 'active').order('full_name'),
    supabase.from('funds').select('id, name, type, masjid_id').eq('status', 'active'),
    supabase.from('masjids').select('id, name').eq('status', 'active'),
  ])

  // Pre-load unpaid months for the pre-selected member
  let unpaidMonths: { year: number; month: number; amount_due: number; amount_paid: number }[] = []
  if (searchParams.member_id) {
    const { data } = await supabase
      .from('member_monthly_fees')
      .select('year, month, amount_due, amount_paid')
      .eq('member_id', searchParams.member_id)
      .in('status', ['unpaid', 'overdue', 'partially_paid'])
      .order('year').order('month')
    unpaidMonths = data ?? []
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Record Cash Payment</h1>
      <CollectForm
        action={recordCashPayment}
        members={members ?? []}
        funds={funds ?? []}
        masjids={masjids ?? []}
        preselectedMemberId={searchParams.member_id}
        preselectedYear={searchParams.year ? Number(searchParams.year) : undefined}
        preselectedMonth={searchParams.month ? Number(searchParams.month) : undefined}
        initialUnpaidMonths={unpaidMonths}
      />
    </div>
  )
}
