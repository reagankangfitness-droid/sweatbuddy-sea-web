// Airbnb-inspired Design System with #FFD483 Golden Yellow Brand Color

export const colors = {
  // Brand Golden Yellow - Use SPARINGLY for CTAs, prices, active states (like Airbnb uses pink)
  brand: {
    primary: '#FFD483',        // Warm golden yellow
    primaryHover: '#F5C563',   // 10% darker for hover states
    primaryLight: 'rgba(255, 212, 131, 0.1)',
    primaryText: '#222222',    // Dark text on golden yellow (for accessibility)
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
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",

  // Font Sizes
  sizes: {
    hero: '48px',
    h1: '48px',
    h2: '32px',
    h3: '24px',
    h4: '18px',
    body: '16px',
    caption: '14px',
    small: '12px',
  },

  // Font Weights
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
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
