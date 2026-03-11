/**
 * SweatBuddies P2P Design System
 * Dark-first, neutral palette, white as the single accent.
 * Reference these tokens — do not use arbitrary values in components.
 */

// ─── Color palette ────────────────────────────────────────────────────────────
// The UI is dark (neutral-950 bg). White is the primary action color.
// Activity types get their own tinted pill colors (see utils.getActivityColor).

export const colors = {
  background: '#0A0A0A',   // neutral-950
  surface:    '#171717',   // neutral-900 — cards
  elevated:   '#262626',   // neutral-800 — hover states, secondary surfaces
  border:     '#262626',   // neutral-800
  borderSubtle: '#1C1C1C', // near-black border

  text: {
    primary:   '#F5F5F5',  // neutral-100
    secondary: '#A3A3A3',  // neutral-400
    muted:     '#525252',  // neutral-600
  },

  accent: {
    primary:  '#FFFFFF',   // white — CTAs, active states
    success:  '#16A34A',   // green-600
    error:    '#DC2626',   // red-600
    warning:  '#D97706',   // amber-600
  },
}

// ─── Spacing (8-pt grid) ──────────────────────────────────────────────────────
export const spacing = {
  1:  '0.25rem',  // 4px
  2:  '0.5rem',   // 8px
  3:  '0.75rem',  // 12px
  4:  '1rem',     // 16px
  5:  '1.25rem',  // 20px
  6:  '1.5rem',   // 24px
  8:  '2rem',     // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
}

// ─── Border radius ────────────────────────────────────────────────────────────
export const radius = {
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '20px',
  full: '9999px',
}

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const shadows = {
  card:      '0 2px 8px rgba(0,0,0,0.3)',
  cardHover: '0 8px 24px rgba(0,0,0,0.5)',
  modal:     '0 16px 48px rgba(0,0,0,0.6)',
}

// ─── Motion ───────────────────────────────────────────────────────────────────
export const motion = {
  spring: { type: 'spring', stiffness: 400, damping: 30 } as const,
  fade:   { duration: 0.15 } as const,
}

// ─── Z-index layers ───────────────────────────────────────────────────────────
export const zIndex = {
  base:     0,
  dropdown: 10,
  sticky:   20,
  modal:    30,
  nav:      50,
}
