'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function getMasjidProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mu } = await supabase
    .from('masjid_users')
    .select('masjid_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!mu) redirect('/login')

  const { data: masjid } = await supabase
    .from('masjids')
    .select('*')
    .eq('id', mu.masjid_id)
    .single()

  return { supabase, user, masjid }
}

export async function generateRecommendationLetter(formData: FormData): Promise<{ html: string; error?: string }> {
  try {
    const { masjid } = await getMasjidProfile()
    if (!masjid) return { html: '', error: 'Masjid profile not found' }

    const recipientName = formData.get('recipient_name') as string
    const purpose       = formData.get('purpose') as string
    const memberName    = formData.get('member_name') as string
    const memberAddress = formData.get('member_address') as string
    const duration      = formData.get('duration') as string
    const extraNotes    = formData.get('extra_notes') as string

    const prompt = `You are a formal letter writer for ${masjid.name}, an Islamic mosque in Sri Lanka.

Write an official recommendation letter with the following details:

Masjid: ${masjid.name}
${masjid.registration_number ? `Registration No: ${masjid.registration_number}` : ''}
${masjid.address ? `Address: ${masjid.address}` : ''}
${masjid.imam_name ? `Imam: ${masjid.imam_name}` : ''}
${masjid.secretary_name ? `Secretary: ${masjid.secretary_name}` : ''}

Member being recommended: ${memberName}
${memberAddress ? `Member's Address: ${memberAddress}` : ''}
${duration ? `Member since / Duration: ${duration}` : ''}
Purpose: ${purpose}
${recipientName ? `Letter addressed to: ${recipientName}` : 'General purpose letter'}
${extraNotes ? `Additional notes: ${extraNotes}` : ''}

Write a formal, respectful letter in English. Use Islamic greetings (Assalamu Alaikum).
Include today's date (${new Date().toLocaleDateString('en-LK', { day: 'numeric', month: 'long', year: 'numeric' })}).
The letter should be signed by the Secretary/Imam.
Output ONLY the letter body content (no HTML tags) — start with the date on the right, then addressee, then salutation, body paragraphs, closing, and signature block.`

    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text

    // Wrap in printable HTML with masjid letterhead
    const html = buildLetterHtml(masjid, text)
    return { html }
  } catch (e: any) {
    return { html: '', error: e.message }
  }
}

export async function generateMembershipLetter(formData: FormData): Promise<{ html: string; error?: string }> {
  try {
    const { masjid } = await getMasjidProfile()
    if (!masjid) return { html: '', error: 'Masjid profile not found' }

    const memberName    = formData.get('member_name') as string
    const memberAddress = formData.get('member_address') as string
    const memberId      = formData.get('member_id') as string
    const purpose       = formData.get('purpose') as string
    const recipientName = formData.get('recipient_name') as string

    const prompt = `You are writing an official membership attestation letter for ${masjid.name}, Sri Lanka.

Details:
Masjid: ${masjid.name}
${masjid.registration_number ? `Registration: ${masjid.registration_number}` : ''}
${masjid.imam_name ? `Imam: ${masjid.imam_name}` : ''}
${masjid.secretary_name ? `Secretary: ${masjid.secretary_name}` : ''}

Member Name: ${memberName}
${memberId ? `Member ID: ${memberId}` : ''}
${memberAddress ? `Address: ${memberAddress}` : ''}
Purpose: ${purpose}
${recipientName ? `Addressed to: ${recipientName}` : ''}
Date: ${new Date().toLocaleDateString('en-LK', { day: 'numeric', month: 'long', year: 'numeric' })}

Write a formal attestation letter confirming this person is a registered member of the masjid community. Use Islamic greeting. Output only the letter body text (no HTML).`

    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text
    return { html: buildLetterHtml(masjid, text) }
  } catch (e: any) {
    return { html: '', error: e.message }
  }
}

// ── Build printable HTML letter ───────────────────────────────────────────────
function buildLetterHtml(masjid: any, bodyText: string): string {
  const lines = bodyText.split('\n').map(l => `<p style="margin:0 0 10px 0;line-height:1.7">${l || '&nbsp;'}</p>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${masjid.name} — Official Letter</title>
<style>
  body { font-family: "Times New Roman", serif; font-size: 13pt; color: #000; margin: 0; padding: 0; }
  @media print { .no-print { display: none !important; } body { margin: 0; } }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 25mm; box-sizing: border-box; }
  .header { border-bottom: 2px solid #1a7a4a; padding-bottom: 14px; margin-bottom: 20px; display: flex; align-items: center; gap: 20px; }
  .header img.logo { width: 80px; height: 80px; object-fit: contain; }
  .header-lh img { width: 100%; max-height: 100px; object-fit: contain; }
  .masjid-name { font-size: 18pt; font-weight: bold; color: #1a7a4a; }
  .masjid-sub { font-size: 9pt; color: #666; margin-top: 2px; }
  .body { margin-top: 20px; }
  .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9pt; color: #888; text-align: center; }
</style>
</head>
<body>
<div class="page">
  <!-- Letterhead -->
  <div class="header">
    ${masjid.logo_url ? `<img class="logo" src="${masjid.logo_url}" alt="Logo" />` : ''}
    <div>
      <div class="masjid-name">${masjid.name}</div>
      ${masjid.registration_number ? `<div class="masjid-sub">Reg. No: ${masjid.registration_number}</div>` : ''}
      ${masjid.address ? `<div class="masjid-sub">${masjid.address}</div>` : ''}
      ${masjid.phone ? `<div class="masjid-sub">Tel: ${masjid.phone}${masjid.mobile ? ` | Mob: ${masjid.mobile}` : ''}</div>` : ''}
      ${masjid.email ? `<div class="masjid-sub">${masjid.email}</div>` : ''}
    </div>
  </div>

  <!-- Letter body -->
  <div class="body">${lines}</div>

  <!-- Footer -->
  <div class="footer">
    ${masjid.name}${masjid.address ? ` | ${masjid.address}` : ''}${masjid.phone ? ` | ${masjid.phone}` : ''}
  </div>
</div>

<div class="no-print" style="text-align:center;padding:20px;background:#f3f4f6">
  <button onclick="window.print()" style="background:#1a7a4a;color:white;border:none;padding:12px 28px;border-radius:8px;font-size:15px;cursor:pointer;font-weight:700">
    🖨 Print / Save as PDF
  </button>
</div>
</body>
</html>`
}
