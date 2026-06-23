import { Tabs } from 'expo-router'
import { colors } from '@masjidhub/config'

export default function AdminTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primaryGreen,
        tabBarInactiveTintColor: colors.neutralGray,
        tabBarStyle: { backgroundColor: colors.white },
        headerStyle: { backgroundColor: colors.deepTeal },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="dashboard"    options={{ title: 'Home' }} />
      <Tabs.Screen name="members"      options={{ title: 'Members' }} />
      <Tabs.Screen name="finance"      options={{ title: 'Finance' }} />
      <Tabs.Screen name="announcements"options={{ title: 'Notices' }} />
      <Tabs.Screen name="more"         options={{ title: 'More' }} />
    </Tabs>
  )
}
