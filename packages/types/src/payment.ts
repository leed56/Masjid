export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'other'
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'voided'
export type MonthlyFeeStatus =
  | 'not_generated'
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'waived'
  | 'sponsored'
  | 'overdue'

export type SlipRejectionReason =
  | 'amount_mismatch'
  | 'duplicate_slip'
  | 'invalid_image'
  | 'wrong_account'
  | 'not_found_in_bank'
  | 'other'

export interface Payment {
  id: string
  masjid_id: string
  member_id: string
  fund_id: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  payment_date: string
  reference_no?: string
  slip_url?: string
  collected_by?: string
  approved_by?: string
  receipt_id?: string
  rejection_reason?: SlipRejectionReason
  rejection_notes?: string
  notes?: string
  created_at: string
}

export interface MemberMonthlyFee {
  id: string
  masjid_id: string
  member_id: string
  year: number
  month: number
  amount_due: number
  amount_paid: number
  status: MonthlyFeeStatus
  due_date: string
}

export interface Receipt {
  id: string
  masjid_id: string
  receipt_number: string
  payment_id: string
  member_id: string
  amount: number
  method: PaymentMethod
  fund_id: string
  received_by: string
  approved_by: string
  pdf_url?: string
  voided: boolean
  void_reason?: string
  created_at: string
}
