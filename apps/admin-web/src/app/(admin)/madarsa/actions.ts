'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createClass(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('madarsa_classes').insert({
    masjid_id:        formData.get('masjid_id') as string,
    name:             formData.get('name') as string,
    grade_level:      formData.get('grade_level') as string || null,
    teacher_staff_id: formData.get('teacher_staff_id') as string || null,
    schedule:         formData.get('schedule') as string || null,
    max_students:     formData.get('max_students') ? Number(formData.get('max_students')) : null,
    fee_per_month:    Number(formData.get('fee_per_month') ?? 0),
  })

  revalidatePath('/madarsa')
}

export async function enrollStudent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('madarsa_students').insert({
    masjid_id:     formData.get('masjid_id') as string,
    class_id:      formData.get('class_id') as string,
    full_name:     formData.get('full_name') as string,
    date_of_birth: formData.get('date_of_birth') as string || null,
    guardian_name: formData.get('guardian_name') as string || null,
    guardian_phone:formData.get('guardian_phone') as string || null,
    enrolled_date: formData.get('enrolled_date') as string || new Date().toISOString().split('T')[0],
  })

  revalidatePath('/madarsa')
}

export async function generateMadarsaFees(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const masjid_id = formData.get('masjid_id') as string
  const year  = Number(formData.get('year'))
  const month = Number(formData.get('month'))

  // Get all active students with their class fee
  const { data: students } = await supabase
    .from('madarsa_students')
    .select('id, masjid_id, class_id, madarsa_classes(fee_per_month)')
    .eq('masjid_id', masjid_id)
    .eq('status', 'active')

  if (!students?.length) return

  const rows = students.map(s => {
    const cls = s.madarsa_classes as { fee_per_month: number } | null
    return {
      masjid_id: s.masjid_id,
      student_id: s.id,
      year,
      month,
      amount_due: cls?.fee_per_month ?? 0,
      status: 'unpaid',
    }
  })

  await supabase.from('madarsa_fees').upsert(rows, { onConflict: 'student_id,year,month', ignoreDuplicates: true })
  revalidatePath('/madarsa')
}

export async function recordMadarsaPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fee_id     = formData.get('fee_id') as string
  const amount_paid = Number(formData.get('amount_paid'))

  const { data: fee } = await supabase.from('madarsa_fees').select('amount_due, amount_paid').eq('id', fee_id).single()
  if (!fee) return

  const total_paid = (fee.amount_paid ?? 0) + amount_paid
  const status = total_paid >= fee.amount_due ? 'paid' : 'partial'

  await supabase.from('madarsa_fees').update({
    amount_paid: total_paid,
    status,
    paid_date: new Date().toISOString().split('T')[0],
  }).eq('id', fee_id)

  revalidatePath('/madarsa')
}
