'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Save progress for a specific step and advance to next
export async function saveSetupStep(step: number, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find the masjid this user admins
  const { data: mu } = await supabase
    .from('masjid_users')
    .select('masjid_id')
    .eq('user_id', user.id)
    .eq('role', 'masjid_admin')
    .single()

  if (!mu) redirect('/login')
  const masjid_id = mu.masjid_id
  const nextStep  = step + 1
  const isLast    = step === 6

  let updates: Record<string, unknown> = {
    setup_step:       isLast ? 6 : nextStep,
    profile_complete: isLast,
  }

  if (step === 1) {
    updates = {
      ...updates,
      name:                formData.get('name') as string,
      type:                formData.get('type') as string,
      registration_number: formData.get('registration_number') as string || null,
    }
  }

  if (step === 2) {
    updates = {
      ...updates,
      district: formData.get('district') as string,
      address:  formData.get('address') as string,
      website:  formData.get('website') as string || null,
    }
  }

  if (step === 3) {
    updates = {
      ...updates,
      phone:  formData.get('phone') as string,
      mobile: formData.get('mobile') as string,
      email:  formData.get('email') as string || null,
    }
  }

  if (step === 4) {
    // Handle logo upload
    const logoFile = formData.get('logo') as File
    if (logoFile && logoFile.size > 0) {
      const ext  = logoFile.name.split('.').pop()
      const path = `${masjid_id}/logo.${ext}`
      await supabase.storage.from('masjid-logos').upload(path, logoFile, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('masjid-logos').getPublicUrl(path)
      updates.logo_url = publicUrl
    }

    // Handle letterhead upload
    const lhFile = formData.get('letterhead') as File
    if (lhFile && lhFile.size > 0) {
      const ext  = lhFile.name.split('.').pop()
      const path = `${masjid_id}/letterhead.${ext}`
      await supabase.storage.from('masjid-logos').upload(path, lhFile, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('masjid-logos').getPublicUrl(path)
      updates.letterhead_url = publicUrl
    }
  }

  if (step === 5) {
    updates = {
      ...updates,
      bank_name:    formData.get('bank_name') as string || null,
      bank_account: formData.get('bank_account') as string || null,
      bank_branch:  formData.get('bank_branch') as string || null,
    }
  }

  if (step === 6) {
    updates = {
      ...updates,
      imam_name:        formData.get('imam_name') as string || null,
      secretary_name:   formData.get('secretary_name') as string || null,
      chairperson_name: formData.get('chairperson_name') as string || null,
    }
  }

  await supabase.from('masjids').update(updates).eq('id', masjid_id)
  revalidatePath('/setup')

  if (isLast) redirect('/dashboard')
  else redirect(`/setup?step=${nextStep}`)
}
