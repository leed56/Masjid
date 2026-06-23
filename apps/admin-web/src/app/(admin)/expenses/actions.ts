'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createExpense(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const masjid_id    = formData.get('masjid_id') as string
  const fund_id      = formData.get('fund_id') as string
  const amount       = Number(formData.get('amount'))
  const file         = formData.get('bill') as File

  let bill_url: string | null = null
  if (file && file.size > 0) {
    const ext  = file.name.split('.').pop()
    const path = `${masjid_id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('expense-bills').upload(path, file)
    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage.from('expense-bills').getPublicUrl(path)
      bill_url = publicUrl
    }
  }

  const { data: expense, error } = await supabase.from('expenses').insert({
    masjid_id,
    fund_id,
    category:     formData.get('category') as string,
    amount,
    expense_date: formData.get('expense_date') as string,
    paid_to:      formData.get('paid_to') as string || null,
    method:       formData.get('method') as string || null,
    bill_url,
    notes:        formData.get('notes') as string || null,
    status:       formData.get('status') as string ?? 'pending',
    approved_by:  user.id,
  }).select().single()

  if (error) throw new Error(error.message)

  // Deduct from fund balance if approved
  if (expense.status === 'approved') {
    const { data: fund } = await supabase.from('funds').select('current_balance').eq('id', fund_id).single()
    if (fund) {
      await supabase.from('funds').update({ current_balance: fund.current_balance - amount }).eq('id', fund_id)
    }
  }

  await supabase.from('audit_logs').insert({
    masjid_id,
    actor_user_id: user.id,
    action:        'expense_created',
    entity_type:   'expenses',
    entity_id:     expense.id,
    after_data:    { amount, category: expense.category, fund_id },
  })

  revalidatePath('/expenses')
  redirect('/expenses')
}

export async function approveExpense(expenseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: expense } = await supabase.from('expenses').select('*').eq('id', expenseId).single()
  if (!expense) throw new Error('Expense not found')

  await supabase.from('expenses').update({ status: 'approved', approved_by: user.id }).eq('id', expenseId)

  // Deduct from fund
  const { data: fund } = await supabase.from('funds').select('current_balance').eq('id', expense.fund_id).single()
  if (fund) {
    await supabase.from('funds').update({ current_balance: fund.current_balance - expense.amount }).eq('id', expense.fund_id)
  }

  await supabase.from('audit_logs').insert({
    masjid_id:     expense.masjid_id,
    actor_user_id: user.id,
    action:        'expense_approved',
    entity_type:   'expenses',
    entity_id:     expenseId,
    before_data:   { status: 'pending' },
    after_data:    { status: 'approved' },
  })

  revalidatePath('/expenses')
}

export async function softDeleteExpense(expenseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: expense } = await supabase.from('expenses').select('masjid_id').eq('id', expenseId).single()

  await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', expenseId)

  await supabase.from('audit_logs').insert({
    masjid_id:     expense?.masjid_id,
    actor_user_id: user.id,
    action:        'expense_deleted',
    entity_type:   'expenses',
    entity_id:     expenseId,
  })

  revalidatePath('/expenses')
}
