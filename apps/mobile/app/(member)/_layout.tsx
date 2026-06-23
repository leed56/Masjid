import { Tabs } from 'expo-router'
import { colors } from '@masjidhub/config'

export default function MemberTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primaryGreen,
        tabBarInactiveTintColor: colors.neutralGray,
        tabBarStyle: { backgroundColor: colors.white },
        headerStyle: { backgroundColor: colors.primaryGreen },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="home"          options={{ title: 'Home' }} />
      <Tabs.Screen name="payments"      options={{ title: 'Payments' }} />
      <Tabs.Screen name="announcements" options={{ title: 'Notices' }} />
      <Tabs.Screen name="donate"        options={{ title: 'Donate' }} />
      <Tabs.Screen name="profile"       options={{ title: 'Profile' }} />
    </Tabs>
  )
}
