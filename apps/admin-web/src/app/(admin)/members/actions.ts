'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createMember(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const masjid_id = formData.get('masjid_id') as string

  const payload = {
    masjid_id,
    family_id:           formData.get('family_id') || null,
    member_code:         formData.get('member_code') as string,
    full_name:           formData.get('full_name') as string,
    phone:               formData.get('phone') || null,
    whatsapp:            formData.get('whatsapp') || null,
    email:               formData.get('email') || null,
    nic:                 formData.get('nic') || null,
    address:             formData.get('address') as string,
    area:                formData.get('area') as string,
    district:            formData.get('district') || null,
    family_members_count: formData.get('family_members_count')
                           ? Number(formData.get('family_members_count'))
                           : null,
    gender:              formData.get('gender') || null,
    occupation:          formData.get('occupation') || null,
    monthly_fee_amount:  Number(formData.get('monthly_fee_amount')),
    fee_category:        formData.get('fee_category') as string,
    collector_id:        formData.get('collector_id') || null,
    registered_date:     formData.get('registered_date') as string,
    status:              formData.get('status') as string,
    notes:               formData.get('notes') || null,
  }

  const { error } = await supabase.from('members').insert(payload)
  if (error) throw new Error(error.message)

  revalidatePath('/members')
  redirect('/members')
}

export async function updateMember(id: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const payload = {
    family_id:           formData.get('family_id') || null,
    full_name:           formData.get('full_name') as string,
    phone:               formData.get('phone') || null,
    whatsapp:            formData.get('whatsapp') || null,
    email:               formData.get('email') || null,
    nic:                 formData.get('nic') || null,
    address:             formData.get('address') as string,
    area:                formData.get('area') as string,
    district:            formData.get('district') || null,
    family_members_count: formData.get('family_members_count')
                           ? Number(formData.get('family_members_count'))
                           : null,
    gender:              formData.get('gender') || null,
    occupation:          formData.get('occupation') || null,
    monthly_fee_amount:  Number(formData.get('monthly_fee_amount')),
    fee_category:        formData.get('fee_category') as string,
    collector_id:        formData.get('collector_id') || null,
    status:              formData.get('status') as string,
    notes:               formData.get('notes') || null,
    updated_at:          new Date().toISOString(),
  }

  const { error } = await supabase.from('members').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/members')
  redirect(`/members/${id}`)
}

export async function generateMonthlyFees(masjid_id: string, year: number, month: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all active, non-exempted members for this masjid
  const { data: members, error } = await supabase
    .from('members')
    .select('id, monthly_fee_amount')
    .eq('masjid_id', masjid_id)
    .eq('status', 'active')
    .neq('fee_category', 'exempted')

  if (error) throw new Error(error.message)
  if (!members?.length) return { generated: 0 }

  const dueDate = new Date(year, month - 1, 10).toISOString().split('T')[0] // due on 10th

  const rows = members.map(m => ({
    masjid_id,
    member_id:  m.id,
    year,
    month,
    amount_due:  m.monthly_fee_amount,
    amount_paid: 0,
    status:      'unpaid',
    due_date:    dueDate,
  }))

  // upsert — skip members already generated for this month
  const { error: upsertError } = await supabase
    .from('member_monthly_fees')
    .upsert(rows, { onConflict: 'member_id,year,month', ignoreDuplicates: true })

  if (upsertError) throw new Error(upsertError.message)

  revalidatePath('/members/fees')
  return { generated: rows.length }
}
