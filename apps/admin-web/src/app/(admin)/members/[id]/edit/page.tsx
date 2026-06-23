import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { updateMember } from '../../actions'
import { MemberForm } from '@/components/members/MemberForm'

export default async function EditMemberPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const [{ data: member }, { data: masjids }, { data: families }] = await Promise.all([
    supabase.from('members').select('*').eq('id', params.id).single(),
    supabase.from('masjids').select('id, name, default_monthly_fee').eq('status', 'active'),
    supabase.from('families').select('id, family_name, area'),
  ])

  if (!member) notFound()

  const action = updateMember.bind(null, params.id)

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Edit Member</h1>
      <MemberForm
        action={action}
        masjids={masjids ?? []}
        families={families ?? []}
        defaultValues={member}
      />
    </div>
  )
}
