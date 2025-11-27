// Mention parsing utilities for chat messages

export interface ParsedMention {
  userId: string
  name: string
  startIndex: number
  endIndex: number
}

export interface MentionableUser {
  id: string
  name: string | null
  imageUrl: string | null
}

// Regex to match @mentions - matches @username or @"Full Name"
// Supports: @john, @JohnDoe, @"John Doe", @"Mary Jane"
const MENTION_REGEX = /@(?:"([^"]+)"|(\w+))/g

/**
 * Parse mentions from a message content string
 * Returns array of parsed mentions with user info if users are provided for lookup
 */
export function parseMentions(
  content: string,
  users?: MentionableUser[]
): ParsedMention[] {
  const mentions: ParsedMention[] = []
  let match

  // Reset regex state
  MENTION_REGEX.lastIndex = 0

  while ((match = MENTION_REGEX.exec(content)) !== null) {
    // match[1] is for quoted names, match[2] is for simple names
    const mentionName = match[1] || match[2]

    if (users) {
      // Find user by name (case-insensitive)
      const user = users.find(
        u => u.name?.toLowerCase() === mentionName.toLowerCase()
      )

      if (user && user.name) {
        mentions.push({
          userId: user.id,
          name: user.name,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        })
      }
    } else {
      // Without users lookup, just parse the mention text
      mentions.push({
        userId: '', // Will need to be resolved later
        name: mentionName,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  return mentions
}

/**
 * Extract unique user IDs from mentions
 */
export function extractMentionedUserIds(mentions: ParsedMention[]): string[] {
  return [...new Set(mentions.map(m => m.userId).filter(Boolean))]
}

/**
 * Check if a specific user is mentioned in the content
 */
export function isUserMentioned(
  content: string,
  userId: string,
  users: MentionableUser[]
): boolean {
  const mentions = parseMentions(content, users)
  return mentions.some(m => m.userId === userId)
}

/**
 * Format a name for mention (wraps in quotes if contains spaces)
 */
export function formatMentionName(name: string): string {
  if (name.includes(' ')) {
    return `@"${name}"`
  }
  return `@${name}`
}

/**
 * Get the mention query from cursor position
 * Returns the text after @ if currently typing a mention
 */
export function getMentionQuery(
  content: string,
  cursorPosition: number
): { query: string; startIndex: number } | null {
  // Look backwards from cursor to find @
  const textBeforeCursor = content.slice(0, cursorPosition)

  // Find the last @ that's not inside quotes or followed by a completed mention
  const lastAtIndex = textBeforeCursor.lastIndexOf('@')

  if (lastAtIndex === -1) return null

  // Check if this @ is part of a completed mention
  const textAfterAt = content.slice(lastAtIndex)

  // If there's a space after @word, it's a completed mention
  const matchSimple = textAfterAt.match(/^@(\w+)/)
  const matchQuoted = textAfterAt.match(/^@"([^"]*)"?/)

  if (matchQuoted) {
    // In a quoted mention
    const query = matchQuoted[1]
    // Check if quote is closed
    if (textAfterAt.includes('"', 2) && textAfterAt.indexOf('"', 2) < cursorPosition - lastAtIndex) {
      return null // Closed quote
    }
    return { query, startIndex: lastAtIndex }
  }

  if (matchSimple) {
    const query = matchSimple[1]
    // Check if there's whitespace after the match (completed)
    const afterMatch = textAfterAt.slice(matchSimple[0].length)
    if (afterMatch.length > 0 && cursorPosition > lastAtIndex + matchSimple[0].length) {
      return null // Cursor moved past the mention
    }
    return { query, startIndex: lastAtIndex }
  }

  // Just @ with nothing after
  return { query: '', startIndex: lastAtIndex }
}

/**
 * Replace mention query with formatted mention
 */
export function insertMention(
  content: string,
  startIndex: number,
  cursorPosition: number,
  user: MentionableUser
): { newContent: string; newCursorPosition: number } {
  const beforeMention = content.slice(0, startIndex)
  const afterCursor = content.slice(cursorPosition)

  const mentionText = formatMentionName(user.name || 'Unknown')
  const newContent = beforeMention + mentionText + ' ' + afterCursor
  const newCursorPosition = startIndex + mentionText.length + 1

  return { newContent, newCursorPosition }
}

/**
 * Render content with highlighted mentions
 * Returns array of text segments with mention flags
 */
export interface ContentSegment {
  text: string
  isMention: boolean
  userId?: string
}

export function renderMentionedContent(
  content: string,
  users?: MentionableUser[]
): ContentSegment[] {
  const mentions = parseMentions(content, users)
  const segments: ContentSegment[] = []

  if (mentions.length === 0) {
    return [{ text: content, isMention: false }]
  }

  let lastIndex = 0

  for (const mention of mentions) {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      segments.push({
        text: content.slice(lastIndex, mention.startIndex),
        isMention: false,
      })
    }

    // Add mention
    segments.push({
      text: content.slice(mention.startIndex, mention.endIndex),
      isMention: true,
      userId: mention.userId,
    })

    lastIndex = mention.endIndex
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      text: content.slice(lastIndex),
      isMention: false,
    })
  }

  return segments
}
