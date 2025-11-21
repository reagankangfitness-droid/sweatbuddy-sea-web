import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native'
import { HomeScreen } from '../screens/HomeScreen'
import { ChatListScreen } from '../screens/ChatListScreen'
import { ChannelScreen } from '../screens/ChannelScreen'
import { ProfileScreen } from '../screens/ProfileScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

// Stack navigator for Chat (includes channel list and individual channel screens)
const ChatStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ title: 'Chats' }}
      />
      <Stack.Screen
        name="Channel"
        component={ChannelScreen}
        options={{ title: 'Channel' }}
      />
    </Stack.Navigator>
  )
}

// Main tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStack}
        options={{
          tabBarLabel: 'Chat',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  )
}

// Main app navigator
export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  )
}
