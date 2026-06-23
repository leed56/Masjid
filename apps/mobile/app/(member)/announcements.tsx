import { View, Text } from 'react-native'
import { colors } from '@masjidhub/config'

export default function AnnouncementsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.lightCream, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Announcements</Text>
    </View>
  )
}

