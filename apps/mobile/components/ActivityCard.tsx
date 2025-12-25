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

// Design tokens matching web app
const colors = {
  neutral900: '#171717',
  neutral800: '#262626',
  neutral700: '#404040',
  neutral600: '#525252',
  neutral500: '#737373',
  neutral400: '#A3A3A3',
  neutral300: '#D4D4D4',
  neutral200: '#E5E5E5',
  neutral100: '#F5F5F5',
  neutral50: '#FAFAFA',
  white: '#FFFFFF',
  success: '#16A34A',
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral100,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: colors.neutral200,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral100,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral400,
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
    color: colors.neutral900,
  },
  badge: {
    backgroundColor: colors.neutral900,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: colors.neutral500,
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
    color: colors.neutral700,
  },
  time: {
    fontSize: 14,
    color: colors.neutral500,
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
    backgroundColor: colors.neutral900,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  hostName: {
    fontSize: 14,
    color: colors.neutral700,
    fontWeight: '500',
  },
  priceContainer: {
    marginLeft: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  free: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral900,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participants: {
    fontSize: 12,
    color: colors.neutral500,
  },
  capacity: {
    fontSize: 12,
    color: colors.neutral400,
  },
})
