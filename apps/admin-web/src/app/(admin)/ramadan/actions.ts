'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRamadanProgram(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('ramadan_programs').insert({
    masjid_id:           formData.get('masjid_id') as string,
    hijri_year:          Number(formData.get('hijri_year')),
    gregorian_year:      Number(formData.get('gregorian_year')),
    iftar_time:          formData.get('iftar_time') as string || null,
    sehri_time:          formData.get('sehri_time') as string || null,
    tarawih_time:        formData.get('tarawih_time') as string || null,
    tarawih_rakats:      Number(formData.get('tarawih_rakats') ?? 20),
    imam_name:           formData.get('imam_name') as string || null,
    hafiz_name:          formData.get('hafiz_name') as string || null,
    daily_ifthar_budget: formData.get('daily_ifthar_budget') ? Number(formData.get('daily_ifthar_budget')) : null,
    notes:               formData.get('notes') as string || null,
  })

  revalidatePath('/ramadan')
  redirect('/ramadan')
}

export async function addIftharSponsor(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('ramadan_ifthar_sponsors').insert({
    masjid_id:    formData.get('masjid_id') as string,
    program_id:   formData.get('program_id') as string || null,
    sponsor_name: formData.get('sponsor_name') as string,
    phone:        formData.get('phone') as string || null,
    date:         formData.get('date') as string,
    amount:       formData.get('amount') ? Number(formData.get('amount')) : null,
    is_confirmed: formData.get('is_confirmed') === 'true',
    notes:        formData.get('notes') as string || null,
  })

  revalidatePath('/ramadan')
}
