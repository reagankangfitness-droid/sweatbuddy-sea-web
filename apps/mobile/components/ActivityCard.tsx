import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { Activity } from '../hooks/useActivities'

interface ActivityCardProps {
  activity: Activity
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const formattedDate = activity.startTime
    ? new Date(activity.startTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  const formattedTime = activity.startTime
    ? new Date(activity.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        // TODO: Navigate to activity detail screen
        console.log('Activity pressed:', activity.id)
      }}
    >
      {activity.imageUrl ? (
        <Image source={{ uri: activity.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>{activity.type}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {activity.title}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activity.type}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {activity.description || 'No description'}
        </Text>

        <View style={styles.details}>
          <Text style={styles.location}>{activity.city}</Text>
          {formattedDate && (
            <Text style={styles.time}>
              {formattedDate} {formattedTime}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.hostInfo}>
            {activity.host?.imageUrl || activity.user.imageUrl ? (
              <Image
                source={{
                  uri: activity.host?.imageUrl || activity.user.imageUrl || '',
                }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(activity.host?.name || activity.user.name || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.hostName}>
              {activity.host?.name || activity.user.name || 'Anonymous'}
            </Text>
          </View>

          <View style={styles.priceContainer}>
            {activity.price > 0 ? (
              <Text style={styles.price}>
                {activity.currency} {activity.price.toFixed(2)}
              </Text>
            ) : (
              <Text style={styles.free}>FREE</Text>
            )}
          </View>
        </View>

        <View style={styles.stats}>
          <Text style={styles.participants}>
            {activity._count.userActivities}{' '}
            {activity._count.userActivities === 1 ? 'person' : 'people'} going
          </Text>
          {activity.maxPeople && (
            <Text style={styles.capacity}> / {activity.maxPeople} max</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#444',
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hostName: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  priceContainer: {
    marginLeft: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  free: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participants: {
    fontSize: 12,
    color: '#666',
  },
  capacity: {
    fontSize: 12,
    color: '#999',
  },
})
