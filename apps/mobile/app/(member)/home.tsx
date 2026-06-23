import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { supabase } from '@/lib/supabase'
import { colors } from '@masjidhub/config'
import type { User } from '@supabase/supabase-js'

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.greeting}>As-salamu alaykum</Text>
      <Text style={s.name}>{user?.email ?? 'Member'}</Text>

      <View style={s.card}>
        <Text style={s.cardTitle}>Monthly Fee Status</Text>
        <Text style={s.cardValue}>—</Text>
        <Text style={s.cardSub}>Select your masjid to view</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Latest Announcement</Text>
        <Text style={s.cardSub}>No new announcements</Text>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.lightCream },
  greeting:    { fontSize: 14, color: colors.neutralGray, marginBottom: 2 },
  name:        { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle:   { fontSize: 13, color: colors.neutralGray, marginBottom: 6 },
  cardValue:   { fontSize: 28, fontWeight: '700', color: colors.primaryGreen },
  cardSub:     { fontSize: 13, color: colors.neutralGray, marginTop: 4 },
})
