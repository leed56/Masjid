import { createClient } from '@/lib/supabase/server'
import { createMember } from '../actions'
import { MemberForm } from '@/components/members/MemberForm'

export default async function AddMemberPage() {
  const supabase = await createClient()

  const [{ data: masjids }, { data: families }, { data: collectors }] = await Promise.all([
    supabase.from('masjids').select('id, name, default_monthly_fee').eq('status', 'active'),
    supabase.from('families').select('id, family_name, area'),
    supabase.from('masjid_users').select('user_id, role').eq('role', 'collector'),
  ])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Add Member</h1>
      <MemberForm
        action={createMember}
        masjids={masjids ?? []}
        families={families ?? []}
      />
    </div>
  )
}
