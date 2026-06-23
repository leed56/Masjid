import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatLKR, formatDate } from '@masjidhub/utils'
import { MONTH_NAMES } from '@masjidhub/config'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const report     = searchParams.get('report')    ?? 'collection'
  const year       = Number(searchParams.get('year')  ?? new Date().getFullYear())
  const month      = Number(searchParams.get('month') ?? new Date().getMonth() + 1)
  const masjid_id  = searchParams.get('masjid_id') ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const monthStr   = String(month).padStart(2, '0')
  const monthLabel = `${MONTH_NAMES[month - 1]}-${year}`

  let headers: string[] = []
  let rows:    string[][] = []

  if (report === 'collection') {
    const { data } = await supabase
      .from('payments')
      .select('amount, method, payment_date, members(full_name, member_id_number)')
      .eq('masjid_id', masjid_id).eq('status', 'approved')
      .gte('payment_date', `${year}-${monthStr}-01`)
      .lte('payment_date', `${year}-${monthStr}-31`)
      .order('payment_date', { ascending: false })

    headers = ['Member', 'ID', 'Date', 'Method', 'Amount (LKR)']
    rows = (data ?? []).map(r => {
      const m = r.members as { full_name: string; member_id_number: string } | null
      return [m?.full_name ?? '', m?.member_id_number ?? '', formatDate(r.payment_date), r.method, String(r.amount)]
    })
  }

  if (report === 'unpaid') {
    const { data } = await supabase
      .from('member_monthly_fees')
      .select('amount_due, status, members(full_name, member_id_number, phone)')
      .eq('masjid_id', masjid_id).in('status', ['unpaid', 'overdue'])
      .eq('year', year).eq('month', month)

    headers = ['Member', 'ID', 'Phone', 'Amount Due (LKR)', 'Status']
    rows = (data ?? []).map(r => {
      const m = r.members as { full_name: string; member_id_number: string; phone: string } | null
      return [m?.full_name ?? '', m?.member_id_number ?? '', m?.phone ?? '', String(r.amount_due), r.status]
    })
  }

  if (report === 'funds') {
    const { data } = await supabase
      .from('funds')
      .select('name, type, current_balance, is_restricted, status')
      .eq('masjid_id', masjid_id)
      .order('current_balance', { ascending: false })

    headers = ['Fund', 'Type', 'Restricted', 'Status', 'Balance (LKR)']
    rows = (data ?? []).map(f => [f.name, f.type.replace(/_/g, ' '), f.is_restricted ? 'Yes' : 'No', f.status, String(f.current_balance)])
  }

  if (report === 'expenses') {
    const { data } = await supabase
      .from('expenses')
      .select('amount, category, expense_date, paid_to, method, funds(name)')
      .eq('masjid_id', masjid_id).eq('status', 'approved').is('deleted_at', null)
      .gte('expense_date', `${year}-${monthStr}-01`)
      .lte('expense_date', `${year}-${monthStr}-31`)

    headers = ['Date', 'Category', 'Fund', 'Paid To', 'Method', 'Amount (LKR)']
    rows = (data ?? []).map(r => {
      const f = r.funds as { name: string } | null
      return [formatDate(r.expense_date), r.category.replace(/_/g, ' '), f?.name ?? '', r.paid_to ?? '', r.method ?? '', String(r.amount)]
    })
  }

  if (report === 'salaries') {
    const { data } = await supabase
      .from('staff_salaries')
      .select('basic_salary, allowance, advance_deduction, bonus, net_paid, paid_date, staff(full_name, role)')
      .eq('masjid_id', masjid_id).eq('year', year).eq('month', month)

    headers = ['Staff', 'Role', 'Basic (LKR)', 'Allowance', 'Deduction', 'Bonus', 'Net Paid (LKR)', 'Paid Date']
    rows = (data ?? []).map(r => {
      const s = r.staff as { full_name: string; role: string } | null
      return [s?.full_name ?? '', s?.role?.replace(/_/g, ' ') ?? '', String(r.basic_salary), String(r.allowance ?? 0), String(r.advance_deduction ?? 0), String(r.bonus ?? 0), String(r.net_paid), formatDate(r.paid_date)]
    })
  }

  // Build CSV
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [
    headers.map(escape).join(','),
    ...rows.map(r => r.map(escape).join(',')),
  ].join('\r\n')

  const filename = `masjidhub-${report}-${report === 'funds' ? 'all' : monthLabel}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
