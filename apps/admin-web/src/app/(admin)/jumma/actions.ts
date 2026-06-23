'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createJummaProgram(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const masjid_id  = formData.get('masjid_id') as string
  const fee_amount = Number(formData.get('fee_amount') ?? 0)
  const fund_id    = formData.get('fund_id') as string || null

  await supabase.from('jumma_programs').insert({
    masjid_id,
    jumma_date:    formData.get('jumma_date') as string,
    moulavi_name:  formData.get('moulavi_name') as string,
    moulavi_phone: formData.get('moulavi_phone') as string || null,
    topic:         formData.get('topic') as string || null,
    fee_amount,
    fee_paid:      formData.get('fee_paid') === 'true',
    fund_id,
    transport:     formData.get('transport') as string || null,
    notes:         formData.get('notes') as string || null,
    created_by:    user.id,
  })

  revalidatePath('/jumma')
  redirect('/jumma')
}

export async function markFeePaid(id: string, masjid_id: string, fund_id: string | null, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('jumma_programs').update({ fee_paid: true }).eq('id', id)

  // Deduct from fund if linked
  if (fund_id && amount > 0) {
    const { data: fund } = await supabase.from('funds').select('current_balance').eq('id', fund_id).single()
    if (fund) {
      await supabase.from('funds').update({ current_balance: fund.current_balance - amount }).eq('id', fund_id)
    }
    await supabase.from('expenses').insert({
      masjid_id,
      fund_id,
      category:     'jumma_moulavi_fee',
      amount,
      expense_date: new Date().toISOString().split('T')[0],
      status:       'approved',
      paid_to:      'Jumma Moulavi',
      created_by:   user.id,
    })
    await supabase.from('audit_logs').insert({
      masjid_id,
      actor_user_id: user.id,
      action:        'jumma_fee_paid',
      entity_type:   'jumma_programs',
      entity_id:     id,
      after_data:    { amount },
    })
  }

  revalidatePath('/jumma')
}
