'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createFamily(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('families').insert({
    masjid_id:   formData.get('masjid_id') as string,
    family_name: formData.get('family_name') as string,
    address:     formData.get('address') as string,
    area:        formData.get('area') as string,
    category:    formData.get('category') as string,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/members/families')
}
