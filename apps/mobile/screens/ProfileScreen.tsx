import React from 'react'
import { View, Text, StyleSheet, Button } from 'react-native'
import { useUser, useAuth } from '@clerk/clerk-expo'

export const ProfileScreen = () => {
  const { user } = useUser()
  const { signOut } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user && (
        <>
          <Text style={styles.text}>Name: {user.fullName || 'Not set'}</Text>
          <Text style={styles.text}>Email: {user.primaryEmailAddress?.emailAddress}</Text>
        </>
      )}
      <Button title="Sign Out" onPress={() => signOut()} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
})
