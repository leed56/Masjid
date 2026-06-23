import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { supabase } from '@/lib/supabase'
import { colors } from '@masjidhub/config'

interface Announcement {
  id: string
  title: string
  body: string
  category: string
  priority: string
  publish_at: string
}

interface JanazaNotice {
  id: string
  deceased_name: string
  area: string
  gender: string | null
  age: number | null
  janaza_time: string
  burial_place: string
  contact_person: string | null
  message: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  general:           'General',
  jumma:             'Jumma',
  ramadan:           'Ramadan',
  payment_reminder:  'Fee Reminder',
  emergency:         'Emergency',
  volunteer:         'Volunteer',
  development_appeal:'Appeal',
}

const CATEGORY_COLORS: Record<string, string> = {
  emergency:  '#dc2626',
  urgent:     '#dc2626',
  jumma:      colors.deepTeal,
  ramadan:    colors.gold,
  default:    colors.primaryGreen,
}

export default function NoticesScreen() {
  const [tab, setTab]             = useState<'notices' | 'janaza'>('notices')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [janaza, setJanaza]       = useState<JanazaNotice[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [masjidId, setMasjidId]   = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('masjid_users')
        .select('masjid_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
        .then(({ data }) => {
          if (data) {
            setMasjidId(data.masjid_id)
            load(data.masjid_id)
          }
        })
    })
  }, [])

  async function load(mid: string) {
    const [{ data: a }, { data: j }] = await Promise.all([
      supabase
        .from('announcements')
        .select('id, title, body, category, priority, publish_at')
        .eq('masjid_id', mid)
        .eq('status', 'published')
        .order('publish_at', { ascending: false })
        .limit(30),
      supabase
        .from('janaza_announcements')
        .select('id, deceased_name, area, gender, age, janaza_time, burial_place, contact_person, message')
        .eq('masjid_id', mid)
        .not('approved_by', 'is', null)
        .order('janaza_time', { ascending: false })
        .limit(20),
    ])
    setAnnouncements(a ?? [])
    setJanaza(j ?? [])
  }

  async function onRefresh() {
    setRefreshing(true)
    if (masjidId) await load(masjidId)
    setRefreshing(false)
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <View style={s.container}>
      {/* Tab switcher */}
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tab, tab === 'notices' && s.tabActive]} onPress={() => setTab('notices')}>
          <Text style={[s.tabText, tab === 'notices' && s.tabTextActive]}>Notices</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'janaza' && s.tabActive]} onPress={() => setTab('janaza')}>
          <Text style={[s.tabText, tab === 'janaza' && s.tabTextActive]}>Janaza</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tab === 'notices' && (
          <>
            {announcements.length === 0 && <Text style={s.empty}>No announcements at this time.</Text>}
            {announcements.map(a => {
              const catColor = CATEGORY_COLORS[a.priority === 'urgent' ? 'urgent' : a.category] ?? CATEGORY_COLORS.default
              return (
                <View key={a.id} style={[s.card, { borderLeftColor: catColor }]}>
                  <View style={s.cardHeader}>
                    <View style={[s.badge, { backgroundColor: catColor + '20' }]}>
                      <Text style={[s.badgeText, { color: catColor }]}>
                        {a.priority === 'urgent' ? 'URGENT' : CATEGORY_LABELS[a.category] ?? a.category}
                      </Text>
                    </View>
                    <Text style={s.cardDate}>{fmtDate(a.publish_at)}</Text>
                  </View>
                  <Text style={s.cardTitle}>{a.title}</Text>
                  <Text style={s.cardBody}>{a.body}</Text>
                </View>
              )
            })}
          </>
        )}

        {tab === 'janaza' && (
          <>
            <Text style={s.innalillah}>Inna lillahi wa inna ilayhi raji'un</Text>
            {janaza.length === 0 && <Text style={s.empty}>No janaza announcements.</Text>}
            {janaza.map(j => (
              <View key={j.id} style={[s.card, { borderLeftColor: colors.deepTeal }]}>
                <Text style={s.janazaName}>{j.deceased_name}</Text>
                <Text style={s.janazaSub}>
                  {j.gender ? `${j.gender === 'male' ? 'Br.' : 'Sis.'} ` : ''}
                  {j.age ? `Age ${j.age} · ` : ''}
                  {j.area}
                </Text>
                <View style={s.janazaGrid}>
                  <JanazaRow label="Janaza Time" value={fmtDate(j.janaza_time)} />
                  <JanazaRow label="Burial"      value={j.burial_place} />
                  {j.contact_person && <JanazaRow label="Contact" value={j.contact_person} />}
                </View>
                {j.message && <Text style={s.janazaMsg}>{j.message}</Text>}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function JanazaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600' }}>{label.toUpperCase()}</Text>
      <Text style={{ fontSize: 13, color: '#111', marginTop: 1 }}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f5f5f0' },
  tabBar:         { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 16, gap: 4, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab:            { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:      { borderBottomColor: colors.primaryGreen },
  tabText:        { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  tabTextActive:  { color: colors.primaryGreen, fontWeight: '700' },
  scroll:         { padding: 16, gap: 12 },
  card:           { backgroundColor: 'white', borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge:          { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText:      { fontSize: 10, fontWeight: '700' },
  cardDate:       { fontSize: 11, color: '#9ca3af' },
  cardTitle:      { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 6 },
  cardBody:       { fontSize: 13, color: '#374151', lineHeight: 20 },
  innalillah:     { textAlign: 'center', fontStyle: 'italic', color: '#6b7280', fontSize: 13, marginBottom: 12 },
  janazaName:     { fontSize: 16, fontWeight: '700', color: '#111' },
  janazaSub:      { fontSize: 13, color: '#6b7280', marginTop: 2 },
  janazaGrid:     { marginTop: 8 },
  janazaMsg:      { marginTop: 10, padding: 10, backgroundColor: '#f9fafb', borderRadius: 8, fontSize: 13, color: '#374151', fontStyle: 'italic' },
  empty:          { textAlign: 'center', color: '#9ca3af', fontSize: 14, marginTop: 40 },
})
