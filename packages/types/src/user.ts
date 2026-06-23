export type UserRole =
  | 'super_admin'
  | 'masjid_admin'
  | 'treasurer'
  | 'secretary'
  | 'collector'
  | 'moulavi'
  | 'muazzin'
  | 'madarsa_admin'
  | 'member'
  | 'public'

export interface MasjidUser {
  id: string
  masjid_id: string
  user_id: string
  role: UserRole
  status: 'active' | 'inactive' | 'invited'
  created_at: string
}

export interface UserProfile {
  id: string
  full_name: string
  phone?: string
  avatar_url?: string
  created_at: string
}
