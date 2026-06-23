import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { colors } from '@masjidhub/config'

interface UnpaidMember {
  member_id: string
  full_name: string
  member_id_number: string
  months_overdue: number
  total_due: number
}

export default function UnpaidScreen() {
  const [members, setMembers]     = useState<UnpaidMember[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [masjidId, setMasjidId]   = useState<string | null>(null)

  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('masjid_users').select('masjid_id').eq('user_id', user.id).eq('status', 'active').single()
        .then(({ data }) => { if (data) { setMasjidId(data.masjid_id); load(data.masjid_id) } })
    })
  }, [])

  async function load(mid: string) {
    // Get unpaid fees for current month grouped by member
    const { data } = await supabase
      .from('member_monthly_fees')
      .select('member_id, amount_due, members(full_name, member_id_number)')
      .eq('masjid_id', mid)
      .in('status', ['unpaid', 'overdue'])
      .eq('year', year)
      .eq('month', month)
      .order('members(full_name)')

    if (!data) return

    // Aggregate per member
    const map = new Map<string, UnpaidMember>()
    for (const row of data) {
      const m = row.members as { full_name: string; member_id_number: string } | null
      if (!m) continue
      const existing = map.get(row.member_id)
      if (existing) {
        existing.months_overdue += 1
        existing.total_due += row.amount_due
      } else {
        map.set(row.member_id, {
          member_id:        row.member_id,
          full_name:        m.full_name,
          member_id_number: m.member_id_number,
          months_overdue:   1,
          total_due:        row.amount_due,
        })
      }
    }
    setMembers(Array.from(map.values()))
  }

  async function onRefresh() {
    setRefreshing(true)
    if (masjidId) await load(masjidId)
    setRefreshing(false)
  }

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={s.summary}>
        <Text style={s.summaryText}>{members.length} members unpaid this month</Text>
      </View>
      {members.map(m => (
        <TouchableOpacity key={m.member_id} style={s.card}
          onPress={() => router.push(`/(collector)/collect`)}>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{m.full_name}</Text>
            <Text style={s.sub}>{m.member_id_number}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.due}>LKR {m.total_due.toLocaleString()}</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>{m.months_overdue} month{m.months_overdue !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
      {members.length === 0 && !refreshing && (
        <Text style={s.empty}>All members have paid for this month.</Text>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f5f5f0' },
  summary:     { margin: 12, backgroundColor: '#fee2e2', borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  card:        { marginHorizontal: 12, marginBottom: 8, backgroundColor: 'white', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  name:        { fontSize: 15, fontWeight: '600', color: '#111' },
  sub:         { fontSize: 12, color: '#6b7280', marginTop: 2 },
  due:         { fontSize: 15, fontWeight: '700', color: '#dc2626' },
  badge:       { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginTop: 4 },
  badgeText:   { fontSize: 11, color: '#dc2626', fontWeight: '700' },
  empty:       { textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: 48 },
})
