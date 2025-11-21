import React, { useEffect, useState } from 'react'
import { StreamChat } from 'stream-chat'
import { Chat, OverlayProvider } from 'stream-chat-react-native'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { ActivityIndicator, View, Text } from 'react-native'
import { config } from '../config'

let chatClient: StreamChat | null = null

export const StreamChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const setupChat = async () => {
      if (!user) {
        return
      }

      if (!config.stream.apiKey) {
        setError('Stream API key not configured')
        return
      }

      try {
        // Initialize Stream Chat client
        if (!chatClient) {
          chatClient = StreamChat.getInstance(config.stream.apiKey)
        }

        // Get Clerk auth token
        const clerkToken = await getToken()
        if (!clerkToken) {
          setError('Authentication required')
          return
        }

        // Get Stream token from backend
        // You need to create this endpoint in your API
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/stream/token`, {
          headers: {
            'Authorization': `Bearer ${clerkToken}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to get Stream token')
        }

        const { token: streamToken } = await response.json()

        // Connect user to Stream Chat
        await chatClient.connectUser(
          {
            id: user.id,
            name: user.fullName || user.firstName || 'User',
            image: user.imageUrl,
          },
          streamToken
        )

        setIsReady(true)
        setError(null)
      } catch (err) {
        console.error('Failed to setup Stream Chat:', err)
        setError(err instanceof Error ? err.message : 'Failed to connect to chat')
      }
    }

    setupChat()

    return () => {
      if (chatClient) {
        chatClient.disconnectUser()
        setIsReady(false)
      }
    }
  }, [user, getToken])

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: 'red', textAlign: 'center' }}>{error}</Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' }}>
          Please configure Stream API keys and backend endpoint
        </Text>
      </View>
    )
  }

  if (!isReady || !chatClient) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Connecting to chat...</Text>
      </View>
    )
  }

  return (
    <OverlayProvider>
      <Chat client={chatClient}>{children}</Chat>
    </OverlayProvider>
  )
}
