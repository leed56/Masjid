import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { supabase } from '@/lib/supabase'
import { colors } from '@masjidhub/config'

interface Payment {
  id: string
  amount: number
  method: string
  payment_date: string
  members: { full_name: string } | null
}

export default function TodayScreen() {
  const [payments, setPayments]   = useState<Payment[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId]       = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id) }
    })
  }, [])

  async function load(uid: string) {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('payments')
      .select('id, amount, method, payment_date, members(full_name)')
      .eq('collected_by', uid)
      .eq('payment_date', today)
      .order('created_at', { ascending: false })
    setPayments(data ?? [])
  }

  async function onRefresh() {
    setRefreshing(true)
    if (userId) await load(userId)
    setRefreshing(false)
  }

  const total = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Summary */}
      <View style={s.summary}>
        <Text style={s.summaryLabel}>Total Collected Today</Text>
        <Text style={s.summaryValue}>LKR {total.toLocaleString()}</Text>
        <Text style={s.summaryCount}>{payments.length} payment{payments.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={s.list}>
        {payments.length === 0 && (
          <Text style={s.empty}>No collections yet today.</Text>
        )}
        {payments.map(p => (
          <View key={p.id} style={s.row}>
            <View>
              <Text style={s.rowName}>{(p.members as { full_name: string } | null)?.full_name ?? '—'}</Text>
              <Text style={s.rowMeta}>{p.method.replace(/_/g, ' ')}</Text>
            </View>
            <Text style={s.rowAmt}>LKR {p.amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f5f5f0' },
  summary:      { backgroundColor: colors.primaryGreen, margin: 12, borderRadius: 16, padding: 24, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  summaryValue: { color: 'white', fontSize: 32, fontWeight: '800', marginTop: 4 },
  summaryCount: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  list:         { margin: 12, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden' },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowName:      { fontSize: 14, fontWeight: '600', color: '#111' },
  rowMeta:      { fontSize: 12, color: '#6b7280', marginTop: 2 },
  rowAmt:       { fontSize: 15, fontWeight: '700', color: colors.primaryGreen },
  empty:        { textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: 40 },
})
