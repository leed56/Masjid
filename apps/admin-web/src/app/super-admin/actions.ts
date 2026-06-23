'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data } = await admin.from('super_admins').select('id').eq('id', user.id).single()
  if (!data) redirect('/dashboard')
  return user
}

export async function createMasjidAccount(formData: FormData) {
  await assertSuperAdmin()
  const admin = createAdminClient()

  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const name     = formData.get('masjid_name') as string
  const type     = formData.get('masjid_type') as string
  const plan     = formData.get('plan') as string

  // 1. Create auth user (admin API — bypasses email confirmation)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { masjid_name: name, role: 'masjid_admin' },
  })
  if (authError) throw new Error(authError.message)

  const userId = authData.user.id

  // 2. Create masjid record
  const { data: masjid, error: masjidError } = await admin.from('masjids').insert({
    name,
    type,
    status:           'active',
    profile_complete: false,
    setup_step:       1,
    created_by_admin: userId,
  }).select().single()
  if (masjidError) throw new Error(masjidError.message)

  // 3. Link user to masjid as masjid_admin
  await admin.from('masjid_users').insert({
    masjid_id: masjid.id,
    user_id:   userId,
    role:      'masjid_admin',
    status:    'active',
  })

  // 4. Create subscription
  await admin.from('subscriptions').insert({
    masjid_id: masjid.id,
    plan,
    status:    'active',
  })

  revalidatePath('/super-admin')
  redirect('/super-admin')
}

export async function suspendMasjid(masjid_id: string) {
  await assertSuperAdmin()
  const admin = createAdminClient()
  await admin.from('masjids').update({ status: 'suspended' }).eq('id', masjid_id)
  revalidatePath('/super-admin')
}

export async function activateMasjid(masjid_id: string) {
  await assertSuperAdmin()
  const admin = createAdminClient()
  await admin.from('masjids').update({ status: 'active' }).eq('id', masjid_id)
  revalidatePath('/super-admin')
}

export async function resetPassword(email: string, newPassword: string) {
  await assertSuperAdmin()
  const admin = createAdminClient()

  const { data: users } = await admin.auth.admin.listUsers()
  const user = users.users.find(u => u.email === email)
  if (!user) throw new Error('User not found')

  await admin.auth.admin.updateUserById(user.id, { password: newPassword })
  revalidatePath('/super-admin')
}
