import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { colors } from '@masjidhub/config'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      Alert.alert('Login failed', error.message)
    } else {
      router.replace('/(member)/home')
    }
    setLoading(false)
  }

  return (
    <View style={s.container}>
      <Text style={s.appName}>MasjidHub LK</Text>
      <Text style={s.subtitle}>Sign in to your account</Text>

      <TextInput
        style={s.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
        <Text style={s.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightCream,
    justifyContent: 'center',
    padding: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primaryGreen,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.neutralGray,
    marginBottom: 32,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutralGrayLight,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
