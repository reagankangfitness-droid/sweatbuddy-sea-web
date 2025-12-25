import React from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useActivities } from '../hooks/useActivities'
import { ActivityCard } from '../components/ActivityCard'

export const HomeScreen = () => {
  const { data: activities, isLoading, error } = useActivities()

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#171717" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading activities</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No activities found</Text>
        <Text style={styles.emptySubtext}>Check back later for workout opportunities!</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Workouts</Text>
        <Text style={styles.subtitle}>Find your next workout buddy</Text>
      </View>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityCard activity={item} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

// Design tokens matching web app
const colors = {
  neutral900: '#171717',
  neutral700: '#404040',
  neutral500: '#737373',
  neutral400: '#A3A3A3',
  neutral200: '#E5E5E5',
  neutral100: '#F5F5F5',
  neutral50: '#FAFAFA',
  white: '#FFFFFF',
  error: '#DC2626',
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
    marginBottom: 4,
    color: colors.neutral900,
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral500,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.neutral500,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.neutral500,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.neutral900,
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.neutral500,
    textAlign: 'center',
  },
})
