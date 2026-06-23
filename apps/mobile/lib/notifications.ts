import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId })
  return tokenData
}

export async function savePushToken(masjid_id: string): Promise<void> {
  const token = await registerForPushNotifications()
  if (!token) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('push_tokens').upsert(
    { user_id: user.id, masjid_id, token, platform: 'android' },
    { onConflict: 'user_id,token' },
  )
}
