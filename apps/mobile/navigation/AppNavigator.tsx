import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { HomeScreen } from '../screens/HomeScreen'
import { ChatListScreen } from '../screens/ChatListScreen'
import { ChannelScreen } from '../screens/ChannelScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { SavedScreen } from '../screens/SavedScreen'

// Design tokens matching web app
const colors = {
  neutral900: '#171717',
  neutral500: '#737373',
  neutral400: '#A3A3A3',
  white: '#FFFFFF',
}

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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.neutral900,
        tabBarInactiveTintColor: colors.neutral400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: '#E5E5E5',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home'

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
          } else if (route.name === 'Saved') {
            iconName = focused ? 'heart' : 'heart-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
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
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarLabel: 'Saved',
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
