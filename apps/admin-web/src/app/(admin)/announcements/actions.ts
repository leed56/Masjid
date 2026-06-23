'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const publishNow  = formData.get('publish_now') === 'true'
  const publish_at  = publishNow ? new Date().toISOString() : (formData.get('publish_at') as string || null)
  const status      = publishNow ? 'published' : (publish_at ? 'scheduled' : 'draft')

  const file = formData.get('image') as File
  let image_url: string | null = null
  if (file && file.size > 0) {
    const ext  = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('announcement-images').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('announcement-images').getPublicUrl(path)
      image_url = publicUrl
    }
  }

  const { data: announcement, error } = await supabase.from('announcements').insert({
    masjid_id:   formData.get('masjid_id') as string,
    category:    formData.get('category') as string,
    title:       formData.get('title') as string,
    body:        formData.get('body') as string,
    audience:    formData.get('audience') as string,
    priority:    formData.get('priority') as string,
    publish_at,
    expires_at:  formData.get('expires_at') as string || null,
    image_url,
    created_by:  user.id,
    status,
  }).select().single()

  if (error) throw new Error(error.message)

  // Send push notification immediately if published
  if (status === 'published' && formData.get('send_push') === 'true') {
    await sendPushNotification({
      masjid_id: formData.get('masjid_id') as string,
      title:     formData.get('title') as string,
      body:      formData.get('body') as string,
      category:  formData.get('category') as string,
      deep_link: `masjidhub://announcement/${announcement.id}`,
      supabase,
      actor_id:  user.id,
    })
  }

  await supabase.from('audit_logs').insert({
    masjid_id:     formData.get('masjid_id') as string,
    actor_user_id: user.id,
    action:        'announcement_published',
    entity_type:   'announcements',
    entity_id:     announcement.id,
    after_data:    { title: announcement.title, status, category: announcement.category },
  })

  revalidatePath('/announcements')
  redirect('/announcements')
}

export async function updateAnnouncementStatus(
  id: string,
  status: 'published' | 'archived' | 'draft',
  masjid_id: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('announcements').update({ status }).eq('id', id)

  await supabase.from('audit_logs').insert({
    masjid_id,
    actor_user_id: user.id,
    action:        `announcement_${status}`,
    entity_type:   'announcements',
    entity_id:     id,
  })

  revalidatePath('/announcements')
}

export async function createJanazaAnnouncement(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const masjid_id = formData.get('masjid_id') as string

  const { data: janaza, error } = await supabase.from('janaza_announcements').insert({
    masjid_id,
    deceased_name:   formData.get('deceased_name') as string,
    gender:          formData.get('gender') as string || null,
    age:             formData.get('age') ? Number(formData.get('age')) : null,
    area:            formData.get('area') as string,
    family_relation: formData.get('family_relation') as string || null,
    janaza_time:     formData.get('janaza_time') as string,
    burial_place:    formData.get('burial_place') as string,
    contact_person:  formData.get('contact_person') as string || null,
    message:         formData.get('message') as string || null,
    visibility:      formData.get('visibility') as string,
    created_by:      user.id,
    approved_by:     formData.get('auto_approve') === 'true' ? user.id : null,
  }).select().single()

  if (error) throw new Error(error.message)

  // Send push if auto-approved
  if (formData.get('auto_approve') === 'true' && formData.get('send_push') === 'true') {
    const name = formData.get('deceased_name') as string
    const time = new Date(formData.get('janaza_time') as string).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
    await sendPushNotification({
      masjid_id,
      title:    `Janaza: ${name}`,
      body:     `Janaza prayer at ${time}. ${formData.get('burial_place') ?? ''}`,
      category: 'janaza',
      deep_link: `masjidhub://janaza/${janaza.id}`,
      supabase,
      actor_id:  user.id,
    })
  }

  revalidatePath('/janaza')
  redirect('/janaza')
}

// ─── Push notification helper ────────────────────────────────────────────────
async function sendPushNotification({
  masjid_id, title, body, category, deep_link, supabase, actor_id,
}: {
  masjid_id: string
  title: string
  body: string
  category: string
  deep_link: string
  supabase: Awaited<ReturnType<typeof createClient>>
  actor_id: string
}) {
  // Fetch all push tokens for masjid members
  const { data: users } = await supabase
    .from('masjid_users')
    .select('user_id')
    .eq('masjid_id', masjid_id)
    .eq('status', 'active')

  if (!users?.length) return

  // Insert in-app notifications for all users
  const notifRows = users.map(u => ({
    masjid_id,
    user_id:   u.user_id,
    title,
    body,
    category,
    deep_link,
  }))

  await supabase.from('notifications').insert(notifRows)

  // TODO: send to Expo Push API using stored push tokens
  // This requires a push_tokens table and the Expo push endpoint
  // Implemented in Phase 6 with the Edge Function
}
