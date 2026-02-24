import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const title = searchParams.get('title') || 'Untitled Event'
  const day = searchParams.get('day') || ''
  const time = searchParams.get('time') || ''
  const location = searchParams.get('location') || ''
  const host = searchParams.get('host') || ''
  const category = searchParams.get('category') || ''
  const color = searchParams.get('color') || '#FFFFFF'
  const emoji = searchParams.get('emoji') || ''
  const format = searchParams.get('format') || 'story'

  const isStory = format === 'story'
  const width = 1080
  const height = isStory ? 1920 : 1080

  // Scale factors for story vs post
  const titleSize = isStory
    ? title.length > 30 ? 72 : 88
    : title.length > 30 ? 56 : 68
  const detailSize = isStory ? 36 : 28
  const footerSize = isStory ? 28 : 22
  const padding = isStory ? 80 : 60
  const gap = isStory ? 24 : 16
  const accentHeight = isStory ? 8 : 6

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          padding,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: 120,
            height: accentHeight,
            backgroundColor: color,
            borderRadius: accentHeight,
            marginBottom: isStory ? 48 : 32,
          }}
        />

        {/* Category pill */}
        {category && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: isStory ? 32 : 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: `${isStory ? 12 : 8}px ${isStory ? 24 : 16}px`,
                backgroundColor: '#1a1a1a',
                borderRadius: 100,
                border: `2px solid ${color}33`,
              }}
            >
              {emoji && (
                <span style={{ fontSize: isStory ? 28 : 22, marginRight: 10 }}>{emoji}</span>
              )}
              <span
                style={{
                  fontSize: isStory ? 24 : 18,
                  fontWeight: 600,
                  color: color,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                }}
              >
                {category}
              </span>
            </div>
          </div>
        )}

        {/* Title — centered vertically in remaining space */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: isStory ? 48 : 32,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>

          {/* Details */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap,
            }}
          >
            {day && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: detailSize, marginRight: 16 }}>📅</span>
                <span
                  style={{
                    fontSize: detailSize,
                    color: '#d4d4d4',
                    fontWeight: 500,
                  }}
                >
                  {day}{time ? ` · ${time}` : ''}
                </span>
              </div>
            )}
            {location && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: detailSize, marginRight: 16 }}>📍</span>
                <span
                  style={{
                    fontSize: detailSize,
                    color: '#d4d4d4',
                    fontWeight: 500,
                  }}
                >
                  {location.length > 40 ? location.slice(0, 40) + '...' : location}
                </span>
              </div>
            )}
            {host && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: detailSize, marginRight: 16 }}>👤</span>
                <span
                  style={{
                    fontSize: detailSize,
                    color: '#d4d4d4',
                    fontWeight: 500,
                  }}
                >
                  @{host}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #262626',
            paddingTop: isStory ? 32 : 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: isStory ? 44 : 36,
                height: isStory ? 44 : 36,
                borderRadius: 10,
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isStory ? 24 : 20,
                marginRight: 12,
              }}
            >
              💪
            </div>
            <span
              style={{
                fontSize: footerSize,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              sweatbuddies.co
            </span>
          </div>
          <span
            style={{
              fontSize: footerSize,
              color: '#525252',
              fontWeight: 500,
            }}
          >
            RSVP free
          </span>
        </div>
      </div>
    ),
    { width, height }
  )
}
