export type AnnouncementCategory =
  | 'general'
  | 'janaza'
  | 'jumma'
  | 'ramadan'
  | 'madarsa'
  | 'development_appeal'
  | 'payment_reminder'
  | 'emergency'
  | 'volunteer'

export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export type AnnouncementAudience =
  | 'all_members'
  | 'selected_area'
  | 'unpaid_members'
  | 'donors'
  | 'madarsa_parents'
  | 'committee'
  | 'public'

export interface Announcement {
  id: string
  masjid_id: string
  category: AnnouncementCategory
  title: string
  body: string
  audience: AnnouncementAudience
  priority: 'normal' | 'high' | 'urgent'
  publish_at?: string
  expires_at?: string
  image_url?: string
  created_by: string
  approved_by?: string
  status: AnnouncementStatus
  created_at: string
}

export interface JanazaAnnouncement {
  id: string
  masjid_id: string
  deceased_name: string
  gender?: 'male' | 'female'
  age?: number
  area: string
  family_relation?: string
  janaza_time: string
  burial_place: string
  contact_person?: string
  message?: string
  visibility: 'public' | 'members_only'
  approved_by?: string
  created_by: string
  created_at: string
}
