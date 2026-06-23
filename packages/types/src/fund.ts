export type FundType =
  | 'monthly_fee'
  | 'ramadan'
  | 'development'
  | 'well_wisher'
  | 'madarsa'
  | 'janaza_support'
  | 'zakat'
  | 'sadaqah'
  | 'utility'
  | 'jumma_guest'
  | 'general_donation'

export interface Fund {
  id: string
  masjid_id: string
  name: string
  type: FundType
  opening_balance: number
  current_balance: number
  visibility: 'public' | 'private'
  is_restricted: boolean
  status: 'active' | 'closed'
  created_at: string
}
