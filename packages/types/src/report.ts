export type ReportType =
  | 'daily_collection'
  | 'monthly_fee'
  | 'unpaid_members'
  | 'pending_slips'
  | 'fund_balance'
  | 'income_vs_expense'
  | 'salary'
  | 'ramadan'
  | 'development_fund'
  | 'madarsa_fee'
  | 'donor'
  | 'collector_wise'
  | 'audit_log'
  | 'receipt_register'
  | 'expense_category'

export interface AuditLog {
  id: string
  masjid_id: string
  actor_user_id: string
  action: string
  entity_type: string
  entity_id: string
  before_data?: Record<string, unknown>
  after_data?: Record<string, unknown>
  created_at: string
}
