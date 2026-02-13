export function timeAgo(date: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  if (isNaN(then)) return ''
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 0) return 'Just now'

  if (seconds < 60) return 'Just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`

  const weeks = Math.floor(days / 7)
  if (weeks === 1) return '1w ago'
  return `${weeks}w ago`
}
