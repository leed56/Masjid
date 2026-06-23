import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatLKR } from '@masjidhub/utils'

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: receipt } = await supabase
    .from('receipts')
    .select('*, members(full_name, member_code, address, area), funds(name), masjids(name, address, phone, logo_url)')
    .eq('id', params.id)
    .single()

  if (!receipt) notFound()

  const member = receipt.members as { full_name: string; member_code: string; address: string; area: string } | null
  const fund   = receipt.funds   as { name: string } | null
  const masjid = receipt.masjids as { name: string; address: string; phone: string; logo_url: string } | null

  const methodLabel: Record<string, string> = {
    cash:          'Cash',
    bank_transfer: 'Bank Transfer',
    cheque:        'Cheque',
    other:         'Other',
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Link href="/payments" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>← Payments</Link>
        <button
          onClick={() => window.print()}
          style={{ background: 'var(--color-deep-teal)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Print / Save PDF
        </button>
      </div>

      {/* Receipt card */}
      <div id="receipt-print" style={{ background: 'white', borderRadius: 16, padding: 40, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '2px dashed var(--color-neutral-light)' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary-green)' }}>{masjid?.name ?? 'Masjid'}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{masjid?.address}</div>
          {masjid?.phone && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{masjid.phone}</div>}
          <div style={{ marginTop: 16, fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>PAYMENT RECEIPT</div>
        </div>

        {/* Receipt meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Receipt No.</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary-green)' }}>{receipt.receipt_number}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Date</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(receipt.created_at)}</div>
          </div>
        </div>

        {/* Member info */}
        <div style={{ background: 'var(--color-light-cream)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Received from</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{member?.full_name}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{member?.member_code} · {member?.area}</div>
        </div>

        {/* Payment rows */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-neutral-light)' }}>
              <th style={{ padding: '8px 0', textAlign: 'left', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Description</th>
              <th style={{ padding: '8px 0', textAlign: 'right', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px 0', fontSize: 14 }}>{fund?.name ?? 'Payment'}</td>
              <td style={{ padding: '12px 0', fontSize: 14, textAlign: 'right', fontWeight: 600 }}>{formatLKR(receipt.amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--color-neutral-light)' }}>
              <td style={{ padding: '12px 0', fontSize: 16, fontWeight: 700 }}>Total Paid</td>
              <td style={{ padding: '12px 0', fontSize: 20, fontWeight: 800, textAlign: 'right', color: 'var(--color-primary-green)' }}>
                {formatLKR(receipt.amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Method */}
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 32 }}>
          Payment method: <strong>{methodLabel[receipt.method] ?? receipt.method}</strong>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--color-neutral-light)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <div>Received by: {receipt.received_by}</div>
          <div style={{ textAlign: 'center', color: 'var(--color-primary-green)', fontWeight: 600 }}>MasjidHub LK</div>
          <div>This is an official receipt.</div>
        </div>

        {receipt.voided && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-30deg)', fontSize: 48, fontWeight: 900, color: 'rgba(239,68,68,0.2)', pointerEvents: 'none', letterSpacing: 4 }}>
            VOIDED
          </div>
        )}
      </div>

      <style>{`@media print { button { display: none; } }`}</style>
    </div>
  )
}
