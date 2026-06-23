export type MasjidType = 'jumma' | 'masjid' | 'thakkiya' | 'madrasa_attached' | 'other'
export type MasjidStatus = 'active' | 'inactive' | 'pending'

export interface Masjid {
  id: string
  name: string
  type: MasjidType
  registration_number?: string
  address: string
  district: string
  city: string
  gps_lat?: number
  gps_lng?: number
  phone?: string
  email?: string
  president_name?: string
  secretary_name?: string
  treasurer_name?: string
  bank_account_name?: string
  bank_name?: string
  bank_branch?: string
  bank_account_number?: string
  logo_url?: string
  photo_url?: string
  jumma_prayer_time?: string
  default_monthly_fee: number
  language_preference: 'en' | 'ta' | 'si'
  timezone: string
  status: MasjidStatus
  created_at: string
  updated_at: string
}
