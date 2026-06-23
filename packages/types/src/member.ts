export type MemberStatus = 'active' | 'inactive' | 'moved' | 'deceased' | 'exempted'
export type FeeCategory = 'standard' | 'reduced' | 'exempted' | 'sponsored'
export type FamilyCategory = 'standard' | 'poor' | 'sponsor_supported' | 'committee' | 'exempted'

export interface Family {
  id: string
  masjid_id: string
  family_name: string
  head_of_family_id?: string
  address: string
  area: string
  collector_id?: string
  monthly_fee_plan?: number
  category: FamilyCategory
  created_at: string
}

export interface Member {
  id: string
  masjid_id: string
  family_id?: string
  member_code: string
  full_name: string
  phone?: string
  whatsapp?: string
  email?: string
  nic?: string
  address: string
  area: string
  district?: string
  family_members_count?: number
  gender?: 'male' | 'female'
  occupation?: string
  monthly_fee_amount: number
  fee_category: FeeCategory
  collector_id?: string
  registered_date: string
  status: MemberStatus
  notes?: string
  created_at: string
  updated_at: string
}
