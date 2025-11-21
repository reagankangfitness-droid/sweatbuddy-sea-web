import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import { View, Text, StyleSheet, Button } from 'react-native'
import { StreamChatProvider } from './providers/StreamChatProvider'
import { AppNavigator } from './navigation/AppNavigator'
import { config } from './config'

// Create a client
const queryClient = new QueryClient()

// Secure storage for Clerk tokens
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key)
    } catch (err) {
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch (err) {
      return
    }
  },
}

// Simple sign-in screen for unauthenticated users
const SignInScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SweatBuddy</Text>
      <Text style={styles.subtitle}>Please sign in to continue</Text>
      <Button title="Sign In" onPress={() => {
        // In production, this would navigate to Clerk's sign-in UI
        console.log('Sign in pressed')
      }} />
    </View>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider
        publishableKey={config.clerk.publishableKey}
        tokenCache={tokenCache}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SignedIn>
            <StreamChatProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </StreamChatProvider>
          </SignedIn>
          <SignedOut>
            <SignInScreen />
            <StatusBar style="auto" />
          </SignedOut>
        </GestureHandlerRootView>
      </ClerkProvider>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
})
