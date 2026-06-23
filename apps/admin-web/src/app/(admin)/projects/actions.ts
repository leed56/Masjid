'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const file = formData.get('cover_image') as File
  let cover_image_url: string | null = null
  if (file && file.size > 0) {
    const ext  = file.name.split('.').pop()
    const path = `projects/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('announcement-images').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('announcement-images').getPublicUrl(path)
      cover_image_url = publicUrl
    }
  }

  await supabase.from('development_projects').insert({
    masjid_id:      formData.get('masjid_id') as string,
    title:          formData.get('title') as string,
    description:    formData.get('description') as string || null,
    target_amount:  Number(formData.get('target_amount')),
    fund_id:        formData.get('fund_id') as string || null,
    start_date:     formData.get('start_date') as string || null,
    target_date:    formData.get('target_date') as string || null,
    cover_image_url,
    created_by:     user.id,
  })

  revalidatePath('/projects')
  redirect('/projects')
}

export async function addDonation(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const project_id = formData.get('project_id') as string
  const masjid_id  = formData.get('masjid_id') as string
  const amount     = Number(formData.get('amount'))
  const fund_id    = formData.get('fund_id') as string || null

  await supabase.from('project_donations').insert({
    masjid_id,
    project_id,
    donor_name:  formData.get('donor_name') as string,
    donor_phone: formData.get('donor_phone') as string || null,
    amount,
    method:      formData.get('method') as string || null,
    donated_at:  formData.get('donated_at') as string || new Date().toISOString().split('T')[0],
    notes:       formData.get('notes') as string || null,
  })

  // Update raised_amount
  const { data: proj } = await supabase.from('development_projects').select('raised_amount').eq('id', project_id).single()
  if (proj) {
    await supabase.from('development_projects').update({ raised_amount: proj.raised_amount + amount }).eq('id', project_id)
  }

  // Credit fund if linked
  if (fund_id) {
    const { data: fund } = await supabase.from('funds').select('current_balance').eq('id', fund_id).single()
    if (fund) {
      await supabase.from('funds').update({ current_balance: fund.current_balance + amount }).eq('id', fund_id)
    }
  }

  await supabase.from('audit_logs').insert({
    masjid_id,
    actor_user_id: user.id,
    action:        'project_donation_recorded',
    entity_type:   'development_projects',
    entity_id:     project_id,
    after_data:    { amount, donor: formData.get('donor_name') },
  })

  revalidatePath('/projects')
}

export async function updateProjectStatus(id: string, status: string) {
  const supabase = await createClient()
  await supabase.from('development_projects').update({ status }).eq('id', id)
  revalidatePath('/projects')
}
