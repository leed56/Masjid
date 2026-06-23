'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateReceiptNumber } from '@masjidhub/utils'

// ─── Record a cash payment (collector / treasurer) ───────────────────────────
export async function recordCashPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const masjid_id   = formData.get('masjid_id') as string
  const member_id   = formData.get('member_id') as string
  const fund_id     = formData.get('fund_id') as string
  const amount      = Number(formData.get('amount'))
  const payment_date = formData.get('payment_date') as string
  const notes       = formData.get('notes') as string || null
  const months: string[] = formData.getAll('months[]') as string[]

  // Insert payment as approved immediately (cash — no slip needed)
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      masjid_id,
      member_id,
      fund_id,
      amount,
      method:       'cash',
      status:       'approved',
      payment_date,
      collected_by: user.id,
      approved_by:  user.id,
      notes,
    })
    .select()
    .single()

  if (payErr || !payment) throw new Error(payErr?.message ?? 'Payment insert failed')

  // Mark selected monthly fee records as paid
  if (months.length > 0) {
    await allocateToMonths(supabase, member_id, masjid_id, months, amount, payment.id)
  }

  // Generate receipt
  await createReceipt(supabase, payment, user.id, masjid_id)

  revalidatePath('/payments')
  redirect('/payments')
}

// ─── Member uploads a bank transfer slip ─────────────────────────────────────
export async function uploadPaymentSlip(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const masjid_id    = formData.get('masjid_id') as string
  const member_id    = formData.get('member_id') as string
  const fund_id      = formData.get('fund_id') as string
  const amount       = Number(formData.get('amount'))
  const payment_date = formData.get('payment_date') as string
  const reference_no = formData.get('reference_no') as string || null
  const notes        = formData.get('notes') as string || null
  const file         = formData.get('slip') as File

  let slip_url: string | null = null

  if (file && file.size > 0) {
    const ext  = file.name.split('.').pop()
    const path = `${masjid_id}/${member_id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('payment-slips')
      .upload(path, file, { upsert: false })
    if (uploadErr) throw new Error(uploadErr.message)

    const { data: { publicUrl } } = supabase.storage
      .from('payment-slips')
      .getPublicUrl(path)
    slip_url = publicUrl
  }

  const { error } = await supabase.from('payments').insert({
    masjid_id,
    member_id,
    fund_id,
    amount,
    method:       'bank_transfer',
    status:       'pending',
    payment_date,
    reference_no,
    slip_url,
    notes,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/slips')
  redirect('/slips')
}

// ─── Treasurer approves a slip ───────────────────────────────────────────────
export async function approvePayment(paymentId: string, months: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: payment, error: fetchErr } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (fetchErr || !payment) throw new Error('Payment not found')

  const { error: updateErr } = await supabase
    .from('payments')
    .update({ status: 'approved', approved_by: user.id })
    .eq('id', paymentId)

  if (updateErr) throw new Error(updateErr.message)

  // Allocate to months if provided
  if (months.length > 0) {
    await allocateToMonths(
      supabase,
      payment.member_id,
      payment.masjid_id,
      months,
      payment.amount,
      payment.id,
    )
  }

  // Generate receipt
  await createReceipt(supabase, { ...payment, approved_by: user.id }, user.id, payment.masjid_id)

  // Write audit log
  await supabase.from('audit_logs').insert({
    masjid_id:     payment.masjid_id,
    actor_user_id: user.id,
    action:        'payment_approved',
    entity_type:   'payments',
    entity_id:     paymentId,
    before_data:   { status: 'pending' },
    after_data:    { status: 'approved' },
  })

  revalidatePath('/slips')
  revalidatePath('/payments')
}

// ─── Treasurer rejects a slip ─────────────────────────────────────────────────
export async function rejectPayment(paymentId: string, reason: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: payment } = await supabase.from('payments').select('masjid_id').eq('id', paymentId).single()

  const { error } = await supabase
    .from('payments')
    .update({ status: 'rejected', rejection_reason: reason, rejection_notes: notes, approved_by: user.id })
    .eq('id', paymentId)

  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    masjid_id:     payment?.masjid_id,
    actor_user_id: user.id,
    action:        'payment_rejected',
    entity_type:   'payments',
    entity_id:     paymentId,
    before_data:   { status: 'pending' },
    after_data:    { status: 'rejected', rejection_reason: reason },
  })

  revalidatePath('/slips')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function allocateToMonths(
  supabase: Awaited<ReturnType<typeof createClient>>,
  member_id: string,
  masjid_id: string,
  months: string[],   // format: "YYYY-MM"
  totalAmount: number,
  payment_id: string,
) {
  let remaining = totalAmount

  for (const ym of months) {
    if (remaining <= 0) break
    const [year, month] = ym.split('-').map(Number)

    const { data: fee } = await supabase
      .from('member_monthly_fees')
      .select('id, amount_due, amount_paid')
      .eq('member_id', member_id)
      .eq('year', year)
      .eq('month', month)
      .single()

    if (!fee) continue

    const balance  = fee.amount_due - fee.amount_paid
    const applying = Math.min(remaining, balance)
    const newPaid  = fee.amount_paid + applying
    const newStatus = newPaid >= fee.amount_due ? 'paid' : 'partially_paid'

    await supabase
      .from('member_monthly_fees')
      .update({ amount_paid: newPaid, status: newStatus })
      .eq('id', fee.id)

    remaining -= applying
  }
}

async function createReceipt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payment: Record<string, unknown>,
  userId: string,
  masjid_id: string,
) {
  // Get next sequence number for this masjid
  const { count } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true })
    .eq('masjid_id', masjid_id)

  const receiptNumber = generateReceiptNumber('MH', (count ?? 0) + 1)

  const { data: receipt, error } = await supabase
    .from('receipts')
    .insert({
      masjid_id,
      receipt_number: receiptNumber,
      payment_id:     payment.id as string,
      member_id:      payment.member_id as string,
      amount:         payment.amount as number,
      method:         payment.method as string,
      fund_id:        payment.fund_id as string,
      received_by:    userId,
      approved_by:    payment.approved_by as string ?? userId,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Back-fill receipt_id on the payment
  await supabase.from('payments').update({ receipt_id: receipt.id }).eq('id', payment.id as string)

  return receipt
}
