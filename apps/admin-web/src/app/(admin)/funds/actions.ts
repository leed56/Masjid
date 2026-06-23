'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createFund(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('funds').insert({
    masjid_id:       formData.get('masjid_id') as string,
    name:            formData.get('name') as string,
    type:            formData.get('type') as string,
    opening_balance: Number(formData.get('opening_balance') ?? 0),
    current_balance: Number(formData.get('opening_balance') ?? 0),
    visibility:      formData.get('visibility') as string,
    is_restricted:   formData.get('is_restricted') === 'true',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/funds')
}

export async function transferFunds(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const from_fund_id = formData.get('from_fund_id') as string
  const to_fund_id   = formData.get('to_fund_id') as string
  const amount       = Number(formData.get('amount'))
  const notes        = formData.get('notes') as string
  const masjid_id    = formData.get('masjid_id') as string

  if (from_fund_id === to_fund_id) throw new Error('Cannot transfer to the same fund')

  const { data: fromFund } = await supabase.from('funds').select('current_balance').eq('id', from_fund_id).single()
  if (!fromFund || fromFund.current_balance < amount) throw new Error('Insufficient fund balance')

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from('funds').update({ current_balance: fromFund.current_balance - amount }).eq('id', from_fund_id),
    supabase.from('funds').select('current_balance').eq('id', to_fund_id).single().then(async ({ data }) => {
      if (!data) return { error: new Error('Target fund not found') }
      return supabase.from('funds').update({ current_balance: (data.current_balance ?? 0) + amount }).eq('id', to_fund_id)
    }),
  ])

  if (e1 || e2) throw new Error('Transfer failed')

  await supabase.from('audit_logs').insert({
    masjid_id,
    actor_user_id: user.id,
    action:        'fund_transfer',
    entity_type:   'funds',
    entity_id:     from_fund_id,
    before_data:   { from: from_fund_id, to: to_fund_id, amount },
    after_data:    { notes },
  })

  revalidatePath('/funds')
}
