import React from 'react'
import { StyleSheet } from 'react-native'
import { ChannelList } from 'stream-chat-react-native'
import { useNavigation } from '@react-navigation/native'
import { useUser } from '@clerk/clerk-expo'

export const ChatListScreen = () => {
  const navigation = useNavigation()
  const { user } = useUser()

  const filters = {
    members: { $in: [user?.id || ''] },
  }

  const sort = [{ last_message_at: -1 }]

  return (
    <ChannelList
      filters={filters}
      sort={sort}
      onSelect={(channel) => {
        navigation.navigate('Channel' as never, { channelId: channel.id } as never)
      }}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
