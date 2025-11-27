'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getMentionQuery, insertMention, type MentionableUser } from '@/lib/mentions'
import { cn } from '@/lib/utils'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  mentionableUsers: MentionableUser[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  mentionableUsers,
  placeholder = 'Type a message... Use @ to mention someone',
  disabled = false,
  className,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<MentionableUser[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on query
  const filterSuggestions = useCallback(
    (query: string) => {
      if (!query) {
        return mentionableUsers.slice(0, 5)
      }
      const lowerQuery = query.toLowerCase()
      return mentionableUsers
        .filter((user) => user.name?.toLowerCase().includes(lowerQuery))
        .slice(0, 5)
    },
    [mentionableUsers]
  )

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart || 0

    onChange(newValue)

    // Check for mention query
    const mentionData = getMentionQuery(newValue, cursorPosition)

    if (mentionData) {
      setMentionStartIndex(mentionData.startIndex)
      const filtered = filterSuggestions(mentionData.query)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
      setMentionStartIndex(null)
    }
  }

  // Handle key events for navigation and selection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % suggestions.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
          break
        case 'Enter':
          if (showSuggestions) {
            e.preventDefault()
            selectSuggestion(suggestions[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowSuggestions(false)
          break
        case 'Tab':
          if (showSuggestions) {
            e.preventDefault()
            selectSuggestion(suggestions[selectedIndex])
          }
          break
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  // Select a suggestion
  const selectSuggestion = (user: MentionableUser) => {
    if (mentionStartIndex === null || !inputRef.current) return

    const cursorPosition = inputRef.current.selectionStart || value.length
    const { newContent, newCursorPosition } = insertMention(
      value,
      mentionStartIndex,
      cursorPosition,
      user
    )

    onChange(newContent)
    setShowSuggestions(false)
    setMentionStartIndex(null)

    // Set cursor position after React re-renders
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        inputRef.current.focus()
      }
    }, 0)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [value])

  return (
    <div className={cn('relative', className)}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          'w-full resize-none rounded-lg border border-input bg-background px-3 py-2',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'text-sm'
        )}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 mb-1 w-full max-w-xs bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50"
        >
          <div className="py-1">
            {suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => selectSuggestion(user)}
                className={cn(
                  'w-full px-3 py-2 flex items-center gap-2 text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
              >
                {user.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.name || 'User'}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <span className="text-sm font-medium truncate">
                  {user.name || 'Unknown'}
                </span>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 bg-muted/50 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-background rounded text-xs">Tab</kbd> or{' '}
              <kbd className="px-1 py-0.5 bg-background rounded text-xs">Enter</kbd> to select
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
