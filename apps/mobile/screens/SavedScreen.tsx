import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'

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
}

export const SavedScreen = () => {
  // TODO: Implement saved activities functionality
  const savedActivities: any[] = []

  if (savedActivities.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Saved</Text>
          <Text style={styles.subtitle}>Your favorite workouts</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyText}>No saved activities yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the heart icon on any activity to save it for later
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>{savedActivities.length} saved activities</Text>
      </View>
      <FlatList
        data={savedActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.activityItem}>
            <Text>{item.title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
    maxWidth: 280,
  },
  activityItem: {
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral100,
  },
})
