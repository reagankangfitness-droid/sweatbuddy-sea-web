import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

import { getCategoryEmoji } from '@/lib/categories'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Get event data from query params
  const title = searchParams.get('title')
  const category = searchParams.get('category') || 'Fitness'
  const day = searchParams.get('day') || ''
  const time = searchParams.get('time') || ''
  const location = searchParams.get('location') || 'Singapore'
  const organizer = searchParams.get('organizer') || ''

  const emoji = getCategoryEmoji(category)

  // If no title provided, render homepage OG image
  if (!title) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#171717',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                marginRight: 20,
              }}
            >
              💪
            </div>
            <span
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: 'white',
              }}
            >
              SweatBuddies
            </span>
          </div>
          <span
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: 'white',
              marginBottom: 16,
            }}
          >
            Find Your Crew. Show Up.
          </span>
          <span
            style={{
              fontSize: 24,
              color: '#a3a3a3',
            }}
          >
            Run clubs, yoga, HIIT, cold plunge and more. No membership.
          </span>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }

  // Event-specific OG image
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#171717',
          padding: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                marginRight: 12,
              }}
            >
              💪
            </div>
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: 'white',
              }}
            >
              SweatBuddies
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              backgroundColor: '#262626',
              borderRadius: 50,
            }}
          >
            <span style={{ fontSize: 28, marginRight: 8 }}>{emoji}</span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'white',
              }}
            >
              {category}
            </span>
          </div>
        </div>

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
              fontSize: title.length > 40 ? 52 : 64,
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {day ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginRight: 32,
                }}
              >
                <span style={{ fontSize: 28, marginRight: 10 }}>📅</span>
                <span
                  style={{
                    fontSize: 24,
                    color: '#d4d4d4',
                    fontWeight: 500,
                  }}
                >
                  {day}
                </span>
              </div>
            ) : null}
            {time ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginRight: 32,
                }}
              >
                <span style={{ fontSize: 28, marginRight: 10 }}>🕐</span>
                <span
                  style={{
                    fontSize: 24,
                    color: '#d4d4d4',
                    fontWeight: 500,
                  }}
                >
                  {time}
                </span>
              </div>
            ) : null}
            {location ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 28, marginRight: 10 }}>📍</span>
                <span
                  style={{
                    fontSize: 24,
                    color: '#d4d4d4',
                    fontWeight: 500,
                  }}
                >
                  {location.length > 35 ? location.slice(0, 35) + '...' : location}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 32px',
              backgroundColor: 'white',
              borderRadius: 16,
            }}
          >
            <span style={{ fontSize: 28, marginRight: 16 }}>🙋</span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#171717',
              }}
            >
              Join Event
            </span>
          </div>

          {organizer ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  color: '#737373',
                  marginRight: 12,
                }}
              >
                Hosted by
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  backgroundColor: '#262626',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#E1306C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    marginRight: 8,
                  }}
                >
                  {organizer.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'white',
                  }}
                >
                  @{organizer}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
