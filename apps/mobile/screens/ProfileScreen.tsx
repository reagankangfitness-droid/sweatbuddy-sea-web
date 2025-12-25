import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useUser, useAuth } from '@clerk/clerk-expo'

// Design tokens matching web app
const colors = {
  neutral900: '#171717',
  neutral700: '#404040',
  neutral500: '#737373',
  neutral200: '#E5E5E5',
  neutral100: '#F5F5F5',
  neutral50: '#FAFAFA',
  white: '#FFFFFF',
}

export const ProfileScreen = () => {
  const { user } = useUser()
  const { signOut } = useAuth()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.content}>
        {user && (
          <View style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user.fullName || 'Not set'}</Text>
            <View style={styles.divider} />
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.primaryEmailAddress?.emailAddress}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neutral900,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral100,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: colors.neutral900,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral100,
    marginVertical: 12,
  },
  signOutButton: {
    backgroundColor: colors.neutral900,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
