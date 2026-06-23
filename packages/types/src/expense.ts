export type ExpenseCategory =
  | 'head_moulavi_salary'
  | 'muazzin_salary'
  | 'assistant_moulavi_salary'
  | 'madarsa_teacher_salary'
  | 'cleaner_salary'
  | 'security_salary'
  | 'electricity'
  | 'water'
  | 'internet'
  | 'sound_system'
  | 'carpet'
  | 'ac_fan_repair'
  | 'building_maintenance'
  | 'wudu_toilet_maintenance'
  | 'ramadan_iftar'
  | 'taraweeh_program'
  | 'jumma_guest_payment'
  | 'janaza_support'
  | 'printing_stationery'
  | 'bank_charges'
  | 'development_construction'
  | 'other'

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'paid'

export interface Expense {
  id: string
  masjid_id: string
  fund_id: string
  category: ExpenseCategory
  amount: number
  expense_date: string
  paid_to?: string
  method?: string
  bill_url?: string
  approved_by?: string
  notes?: string
  status: ExpenseStatus
  created_at: string
}
