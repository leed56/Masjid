'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createStaff(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('staff').insert({
    masjid_id:     formData.get('masjid_id') as string,
    full_name:     formData.get('full_name') as string,
    role:          formData.get('role') as string,
    phone:         formData.get('phone') as string || null,
    address:       formData.get('address') as string || null,
    start_date:    formData.get('start_date') as string,
    salary_amount: Number(formData.get('salary_amount')),
    salary_cycle:  formData.get('salary_cycle') as string,
    bank_details:  formData.get('bank_details') as string || null,
    status:        'active',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/salaries')
  redirect('/salaries')
}

export async function recordSalaryPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff_id   = formData.get('staff_id') as string
  const masjid_id  = formData.get('masjid_id') as string
  const fund_id    = formData.get('fund_id') as string
  const basic      = Number(formData.get('basic_salary'))
  const allowance  = Number(formData.get('allowance') ?? 0)
  const deduction  = Number(formData.get('advance_deduction') ?? 0)
  const bonus      = Number(formData.get('bonus') ?? 0)
  const net_paid   = basic + allowance + bonus - deduction
  const month      = Number(formData.get('month'))
  const year       = Number(formData.get('year'))

  const { data: salary, error } = await supabase.from('staff_salaries').upsert({
    staff_id,
    masjid_id,
    month,
    year,
    basic_salary:      basic,
    allowance,
    advance_deduction: deduction,
    bonus,
    net_paid,
    paid_date:         formData.get('paid_date') as string,
    method:            formData.get('method') as string || null,
    notes:             formData.get('notes') as string || null,
    paid:              true,
  }, { onConflict: 'staff_id,year,month' }).select().single()

  if (error) throw new Error(error.message)

  // Record as expense against selected fund
  const { data: staffData } = await supabase.from('staff').select('full_name, role').eq('id', staff_id).single()

  await supabase.from('expenses').insert({
    masjid_id,
    fund_id,
    category:     `${staffData?.role ?? 'staff'}_salary`,
    amount:       net_paid,
    expense_date: formData.get('paid_date') as string,
    paid_to:      staffData?.full_name,
    method:       formData.get('method') as string || null,
    status:       'paid',
    approved_by:  user.id,
    notes:        `Salary for ${month}/${year}`,
  })

  // Deduct from fund
  const { data: fund } = await supabase.from('funds').select('current_balance').eq('id', fund_id).single()
  if (fund) {
    await supabase.from('funds').update({ current_balance: fund.current_balance - net_paid }).eq('id', fund_id)
  }

  await supabase.from('audit_logs').insert({
    masjid_id,
    actor_user_id: user.id,
    action:        'salary_paid',
    entity_type:   'staff_salaries',
    entity_id:     salary.id,
    after_data:    { staff_id, net_paid, month, year },
  })

  revalidatePath('/salaries')
  redirect('/salaries')
}
