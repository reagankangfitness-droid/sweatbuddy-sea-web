import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Category emojis
const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Bootcamp': '💪',
  'Dance': '💃',
  'Dance Fitness': '💃',
  'Combat': '🥊',
  'Outdoor': '🌳',
  'Outdoor Fitness': '🌳',
  'Hiking': '🥾',
  'Meditation': '🧘',
  'Breathwork': '🌬️',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get event data from query params
    const title = searchParams.get('title') || 'SweatBuddies Event'
    const category = searchParams.get('category') || 'Fitness'
    const day = searchParams.get('day') || ''
    const time = searchParams.get('time') || ''
    const location = searchParams.get('location') || 'Singapore'
    const organizer = searchParams.get('organizer') || ''
    const imageUrl = searchParams.get('image')

    const emoji = categoryEmojis[category] || '✨'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a',
            position: 'relative',
          }}
        >
          {/* Background gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #1800ad 0%, #3477f8 50%, #38BDF8 100%)',
              opacity: 0.9,
              display: 'flex',
            }}
          />

          {/* Pattern overlay for texture */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0)',
              backgroundSize: '50px 50px',
              display: 'flex',
            }}
          />

          {/* Content container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '60px',
              height: '100%',
              position: 'relative',
            }}
          >
            {/* Top section - Logo and category */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              {/* Logo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                  }}
                >
                  💪
                </div>
                <span
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '-0.5px',
                  }}
                >
                  SweatBuddies
                </span>
              </div>

              {/* Category badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '50px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span style={{ fontSize: '28px' }}>{emoji}</span>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 600,
                    color: 'white',
                  }}
                >
                  {category}
                </span>
              </div>
            </div>

            {/* Middle section - Event title */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <h1
                style={{
                  fontSize: title.length > 40 ? '52px' : '64px',
                  fontWeight: 800,
                  color: 'white',
                  lineHeight: 1.1,
                  margin: 0,
                  maxWidth: '900px',
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                {title}
              </h1>

              {/* Event details */}
              <div
                style={{
                  display: 'flex',
                  gap: '32px',
                  flexWrap: 'wrap',
                }}
              >
                {day && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>📅</span>
                    <span
                      style={{
                        fontSize: '24px',
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 500,
                      }}
                    >
                      {day}
                    </span>
                  </div>
                )}
                {time && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>🕐</span>
                    <span
                      style={{
                        fontSize: '24px',
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 500,
                      }}
                    >
                      {time}
                    </span>
                  </div>
                )}
                {location && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>📍</span>
                    <span
                      style={{
                        fontSize: '24px',
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 500,
                      }}
                    >
                      {location.length > 40 ? location.slice(0, 40) + '...' : location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom section - CTA and organizer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              {/* CTA */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 32px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
              >
                <span style={{ fontSize: '28px' }}>🙋</span>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#1800ad',
                  }}
                >
                  Join Free Event
                </span>
              </div>

              {/* Organizer */}
              {organizer && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '20px',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    Organized by
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      {organizer.charAt(0).toUpperCase()}
                    </div>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: 'white',
                      }}
                    >
                      @{organizer}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG Image generation error:', error)

    // Return a simple fallback image
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
            background: 'linear-gradient(135deg, #1800ad 0%, #3477f8 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: '64px' }}>💪</span>
            <span
              style={{
                fontSize: '56px',
                fontWeight: 800,
                color: 'white',
              }}
            >
              SweatBuddies
            </span>
          </div>
          <span
            style={{
              fontSize: '32px',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            Free Fitness Events in Singapore
          </span>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
}
