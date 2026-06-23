export type StaffRole =
  | 'head_moulavi'
  | 'muazzin'
  | 'assistant_moulavi'
  | 'madarsa_teacher'
  | 'cleaner'
  | 'security'
  | 'office_helper'
  | 'ramadan_temp'
  | 'guest_speaker'

export type SalaryCycle = 'monthly' | 'weekly' | 'per_event' | 'per_class'

export interface Staff {
  id: string
  masjid_id: string
  full_name: string
  role: StaffRole
  phone?: string
  address?: string
  start_date: string
  salary_amount: number
  salary_cycle: SalaryCycle
  bank_details?: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface StaffSalary {
  id: string
  staff_id: string
  masjid_id: string
  month: number
  year: number
  basic_salary: number
  allowance: number
  advance_deduction: number
  bonus: number
  net_paid: number
  paid_date?: string
  method?: string
  voucher_url?: string
  notes?: string
  paid: boolean
  created_at: string
}
