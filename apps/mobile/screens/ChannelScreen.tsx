import React, { useEffect, useState } from 'react'
import { Channel as ChannelComponent, MessageList, MessageInput, useChannelContext } from 'stream-chat-react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useChatContext } from 'stream-chat-react-native'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import type { Channel } from 'stream-chat'

export const ChannelScreen = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { client } = useChatContext()
  const [channel, setChannel] = useState<Channel | null>(null)

  const { channelId } = route.params as { channelId: string }

  useEffect(() => {
    const initChannel = async () => {
      if (!client) return

      const ch = client.channel('messaging', channelId)
      await ch.watch()
      setChannel(ch)
    }

    initChannel()

    return () => {
      channel?.stopWatching()
    }
  }, [channelId, client])

  if (!channel) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <ChannelComponent channel={channel}>
      <View style={styles.container}>
        <MessageList />
        <MessageInput />
      </View>
    </ChannelComponent>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
