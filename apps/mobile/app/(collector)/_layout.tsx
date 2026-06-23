import { Tabs } from 'expo-router'
import { colors } from '@masjidhub/config'

export default function CollectorLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle:       { backgroundColor: colors.primaryGreen },
      headerTintColor:   'white',
      headerTitleStyle:  { fontWeight: '700' },
      tabBarActiveTintColor:   colors.primaryGreen,
      tabBarInactiveTintColor: '#9ca3af',
    }}>
      <Tabs.Screen name="collect"  options={{ title: 'Collect Payment', tabBarLabel: 'Collect'  }} />
      <Tabs.Screen name="today"    options={{ title: "Today's Collections", tabBarLabel: 'Today' }} />
      <Tabs.Screen name="unpaid"   options={{ title: 'Unpaid Members',    tabBarLabel: 'Unpaid'  }} />
    </Tabs>
  )
}
