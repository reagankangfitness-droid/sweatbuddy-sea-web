// Airbnb-inspired Design System with #FF2828 Cherry Red Brand Color

export const colors = {
  // Brand Cherry Red - Use SPARINGLY for CTAs, prices, active states (like Airbnb uses pink)
  brand: {
    primary: '#FF2828',        // Cherry red
    primaryHover: '#D92222',   // Darker for hover states
    primaryLight: 'rgba(255, 40, 40, 0.1)',
    primaryText: '#FFFFFF',    // White text on cherry red (for accessibility)
  },

  // Neutrals - 90% of the UI
  neutrals: {
    white: '#FFFFFF',
    offWhite: '#F7F7F7',
    lightGray: '#EBEBEB',
    mediumGray: '#717171',     // Secondary text
    darkGray: '#222222',       // Primary text
    black: '#000000',
  },

  // Borders & Dividers
  borders: {
    default: '#DDDDDD',
    light: '#B0B0B0',
  },

  // Semantic Colors
  semantic: {
    success: '#008A05',
    error: '#C13515',
    info: '#0071EB',
  },
};

export const typography = {
  fontFamily: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    display: "'League Spartan', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  },

  // Premium Font Sizes - Airbnb/ClassPass inspired
  sizes: {
    hero: '40px',        // Reduced from 48px - premium restraint
    h1: '36px',          // Reduced from 48px
    h2: '24px',          // Reduced from 32px
    h3: '18px',          // Reduced from 24px
    h4: '15px',          // Reduced from 18px
    bodyLarge: '16px',
    body: '15px',        // Reduced from 16px
    bodySmall: '14px',
    caption: '13px',     // Reduced from 14px
    small: '12px',
    xs: '11px',
    logo: '22px',        // Refined logo size
  },

  // Font Weights - Refined for premium feel
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,      // Headings use this instead of bold
    bold: 700,          // Logo only
  },

  // Line Heights - Premium spacing
  lineHeights: {
    tight: 1.2,         // Headlines
    snug: 1.3,          // Subheads
    normal: 1.5,        // Compact text
    relaxed: 1.6,       // Body text
  },

  // Letter Spacing - Refined
  letterSpacing: {
    tight: '-0.02em',   // Large headings
    snug: '-0.01em',    // Medium headings
    normal: '0',        // Body text
    wide: '0.04em',     // Labels, badges
  },
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
};

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  pill: '40px',
  circle: '50%',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.08)',
  md: '0 6px 16px rgba(0, 0, 0, 0.12)',
  lg: '0 12px 24px rgba(0, 0, 0, 0.15)',
  hover: '0 6px 16px rgba(0, 0, 0, 0.12)',
};

export const transitions = {
  default: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  fast: '0.1s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1280px',
};
