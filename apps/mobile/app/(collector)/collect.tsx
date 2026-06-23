import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { colors } from '@masjidhub/config'

interface Member {
  id: string
  full_name: string
  member_id_number: string
  fee_amount: number
  masjid_id: string
}

interface UnpaidMonth {
  id: string
  year: number
  month: number
  amount_due: number
  status: string
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function CollectScreen() {
  const [search, setSearch]       = useState('')
  const [members, setMembers]     = useState<Member[]>([])
  const [selected, setSelected]   = useState<Member | null>(null)
  const [unpaid, setUnpaid]       = useState<UnpaidMonth[]>([])
  const [chosenMonths, setChosen] = useState<string[]>([])
  const [amount, setAmount]       = useState('')
  const [method, setMethod]       = useState<'cash' | 'bank_transfer'>('cash')
  const [submitting, setSubmit]   = useState(false)
  const [masjidId, setMasjidId]   = useState<string | null>(null)
  const [funds, setFunds]         = useState<{ id: string; name: string }[]>([])
  const [fundId, setFundId]       = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('masjid_users').select('masjid_id').eq('user_id', user.id).eq('status', 'active').single()
        .then(({ data }) => {
          if (data) {
            setMasjidId(data.masjid_id)
            supabase.from('funds').select('id, name').eq('masjid_id', data.masjid_id).eq('status', 'active')
              .then(({ data: f }) => {
                setFunds(f ?? [])
                setFundId(f?.[0]?.id ?? null)
              })
          }
        })
    })
  }, [])

  async function searchMembers(text: string) {
    setSearch(text)
    if (text.length < 2) { setMembers([]); return }
    const { data } = await supabase
      .from('members')
      .select('id, full_name, member_id_number, fee_amount, masjid_id')
      .or(`full_name.ilike.%${text}%,member_id_number.ilike.%${text}%`)
      .eq('status', 'active')
      .limit(8)
    setMembers(data ?? [])
  }

  async function selectMember(m: Member) {
    setSelected(m)
    setMembers([])
    setSearch(m.full_name)

    const { data } = await supabase
      .from('member_monthly_fees')
      .select('id, year, month, amount_due, status')
      .eq('member_id', m.id)
      .in('status', ['unpaid', 'overdue', 'partially_paid'])
      .order('year').order('month')
      .limit(12)
    setUnpaid(data ?? [])
    setChosen([])
    setAmount('')
  }

  function toggleMonth(id: string, amt: number) {
    const newChosen = chosenMonths.includes(id)
      ? chosenMonths.filter(x => x !== id)
      : [...chosenMonths, id]
    setChosen(newChosen)
    const total = (unpaid ?? [])
      .filter(u => newChosen.includes(u.id))
      .reduce((s, u) => s + u.amount_due, 0)
    setAmount(String(total))
  }

  async function submit() {
    if (!selected || !fundId || !amount || chosenMonths.length === 0) {
      Alert.alert('Missing fields', 'Select a member, months, fund, and amount.')
      return
    }
    setSubmit(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Insert payment
      const { data: payment, error } = await supabase.from('payments').insert({
        masjid_id:    selected.masjid_id,
        member_id:    selected.id,
        fund_id:      fundId,
        amount:       Number(amount),
        method,
        payment_date: new Date().toISOString().split('T')[0],
        status:       'approved',
        collected_by: user.id,
      }).select().single()

      if (error) throw error

      // Mark months paid
      for (const feeId of chosenMonths) {
        await supabase.from('member_monthly_fees').update({ status: 'paid', payment_id: payment.id }).eq('id', feeId)
      }

      // Credit fund
      const { data: fund } = await supabase.from('funds').select('current_balance').eq('id', fundId).single()
      if (fund) {
        await supabase.from('funds').update({ current_balance: fund.current_balance + Number(amount) }).eq('id', fundId)
      }

      Alert.alert('Success ✓', `Payment of LKR ${Number(amount).toLocaleString()} recorded for ${selected.full_name}.`)
      setSelected(null); setSearch(''); setUnpaid([]); setChosen([]); setAmount('')
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setSubmit(false)
    }
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.section}>
        <Text style={s.label}>Search Member</Text>
        <TextInput
          style={s.input}
          value={search}
          onChangeText={searchMembers}
          placeholder="Name or member ID…"
          placeholderTextColor="#9ca3af"
        />
        {members.map(m => (
          <TouchableOpacity key={m.id} style={s.suggestion} onPress={() => selectMember(m)}>
            <Text style={s.suggestName}>{m.full_name}</Text>
            <Text style={s.suggestSub}>{m.member_id_number} · LKR {m.fee_amount}/mo</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected && (
        <>
          <View style={s.memberCard}>
            <Text style={s.memberName}>{selected.full_name}</Text>
            <Text style={s.memberSub}>{selected.member_id_number}</Text>
          </View>

          {/* Month selection */}
          {unpaid.length > 0 ? (
            <View style={s.section}>
              <Text style={s.label}>Select Months to Collect</Text>
              <View style={s.months}>
                {unpaid.map(u => {
                  const active = chosenMonths.includes(u.id)
                  return (
                    <TouchableOpacity key={u.id} onPress={() => toggleMonth(u.id, u.amount_due)}
                      style={[s.monthBtn, active && s.monthBtnActive]}>
                      <Text style={[s.monthBtnText, active && s.monthBtnTextActive]}>
                        {MONTH_NAMES[u.month - 1]} {u.year}
                      </Text>
                      <Text style={[s.monthAmt, active && s.monthAmtActive]}>
                        LKR {u.amount_due.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ) : (
            <View style={[s.section, { alignItems: 'center', paddingVertical: 20 }]}>
              <Text style={{ color: colors.primaryGreen, fontWeight: '700', fontSize: 15 }}>✓ All fees paid</Text>
            </View>
          )}

          {/* Amount */}
          <View style={s.section}>
            <Text style={s.label}>Amount (LKR)</Text>
            <TextInput style={s.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor="#9ca3af" />
          </View>

          {/* Method */}
          <View style={s.section}>
            <Text style={s.label}>Payment Method</Text>
            <View style={s.methods}>
              {(['cash', 'bank_transfer'] as const).map(m => (
                <TouchableOpacity key={m} onPress={() => setMethod(m)}
                  style={[s.methodBtn, method === m && s.methodBtnActive]}>
                  <Text style={[s.methodText, method === m && s.methodTextActive]}>
                    {m === 'cash' ? 'Cash' : 'Bank Transfer'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Fund */}
          {funds.length > 1 && (
            <View style={s.section}>
              <Text style={s.label}>Fund</Text>
              {funds.map(f => (
                <TouchableOpacity key={f.id} onPress={() => setFundId(f.id)}
                  style={[s.methodBtn, fundId === f.id && s.methodBtnActive]}>
                  <Text style={[s.methodText, fundId === f.id && s.methodTextActive]}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="white" />
              : <Text style={s.submitText}>Record Payment — LKR {Number(amount || 0).toLocaleString()}</Text>
            }
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f5f5f0' },
  section:         { margin: 12, marginBottom: 0, backgroundColor: 'white', borderRadius: 12, padding: 16 },
  label:           { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:           { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 15, color: '#111', backgroundColor: 'white' },
  suggestion:      { borderTopWidth: 1, borderColor: '#f3f4f6', paddingVertical: 10 },
  suggestName:     { fontSize: 14, fontWeight: '600', color: '#111' },
  suggestSub:      { fontSize: 12, color: '#6b7280', marginTop: 2 },
  memberCard:      { margin: 12, marginBottom: 0, backgroundColor: colors.primaryGreen, borderRadius: 12, padding: 16 },
  memberName:      { fontSize: 17, fontWeight: '700', color: 'white' },
  memberSub:       { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  months:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthBtn:        { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white', alignItems: 'center' },
  monthBtnActive:  { backgroundColor: colors.primaryGreen, borderColor: colors.primaryGreen },
  monthBtnText:    { fontSize: 13, fontWeight: '600', color: '#374151' },
  monthBtnTextActive: { color: 'white' },
  monthAmt:        { fontSize: 11, color: '#6b7280', marginTop: 2 },
  monthAmtActive:  { color: 'rgba(255,255,255,0.8)' },
  methods:         { flexDirection: 'row', gap: 10 },
  methodBtn:       { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: 'white' },
  methodBtnActive: { backgroundColor: colors.deepTeal, borderColor: colors.deepTeal },
  methodText:      { fontSize: 14, fontWeight: '600', color: '#374151' },
  methodTextActive:{ color: 'white' },
  submitBtn:       { margin: 12, backgroundColor: colors.primaryGreen, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 16 },
  submitText:      { color: 'white', fontWeight: '700', fontSize: 16 },
})
