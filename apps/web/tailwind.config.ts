import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      // ═══════════════════════════════════════════════════════
      // FONTS
      // ═══════════════════════════════════════════════════════
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },

      // ═══════════════════════════════════════════════════════
      // ULTRA-MINIMAL COLOR PALETTE
      // Warm neutrals only — no accent colors
      // Black is the only "accent"
      // ═══════════════════════════════════════════════════════
      colors: {
        // Primary neutrals (warm-tinted)
        'neutral': {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          150: '#EDEDED',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },

        // Semantic colors (minimal, functional only)
        'success': '#16A34A',
        'error': '#DC2626',

        // Backgrounds
        'background': '#FFFFFF',
        'surface': '#FAFAFA',

        // Legacy compatibility - map to neutrals
        'gray': {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },

        // Legacy color aliases (all map to neutrals now)
        'forest': {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        'sand': '#FAFAFA',
        'cream': '#FFFFFF',
        'mist': '#F5F5F5',

        // Legacy accent colors - now neutral
        'coral': {
          DEFAULT: '#171717',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        'teal': {
          DEFAULT: '#171717',
          light: '#404040',
          dark: '#0A0A0A',
        },
        'ocean': {
          DEFAULT: '#171717',
          light: '#404040',
          dark: '#0A0A0A',
        },
        'amber': {
          DEFAULT: '#737373',
          light: '#A3A3A3',
          dark: '#525252',
        },
        'terracotta': '#171717',
        'navy': '#171717',
        'electric': '#171717',
        'mint': '#16A34A',

        // Primary (black is the accent)
        'primary': {
          DEFAULT: '#171717',
          foreground: '#FFFFFF',
          hover: '#404040',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },

        // Success state colors
        'success-light': '#F0FDF4',

        // Secondary
        'secondary': {
          DEFAULT: '#FAFAFA',
          foreground: '#171717',
        },

        // Semantic
        'destructive': {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },

        'muted': {
          DEFAULT: '#FAFAFA',
          foreground: '#757575',
        },

        // Borders
        'border': '#E5E5E5',
        'border-light': '#EDEDED',
        'border-subtle': '#F5F5F5',
        'input': '#E5E5E5',
        'ring': '#171717',

        // Cards & Popovers
        'popover': {
          DEFAULT: '#FFFFFF',
          foreground: '#171717',
        },
        'card': {
          DEFAULT: '#FFFFFF',
          foreground: '#171717',
        },

        // Accent colors (all neutral now)
        'accent': {
          teal: '#171717',
          purple: '#525252',
          orange: '#737373',
          yellow: '#A3A3A3',
          pink: '#525252',
          green: '#16A34A',
          blue: '#171717',
        },
      },

      // ═══════════════════════════════════════════════════════
      // TYPOGRAPHY SCALE
      // Clean, consistent, no frills
      // ═══════════════════════════════════════════════════════
      fontSize: {
        // Display (Hero, major headlines)
        'display-xl': ['56px', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-lg': ['44px', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display': ['36px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],

        // Headings
        'heading-xl': ['28px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading-lg': ['24px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading': ['20px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-sm': ['18px', { lineHeight: '1.3', fontWeight: '600' }],

        // Body
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],

        // Small/Caption
        'caption': ['13px', { lineHeight: '1.4', fontWeight: '500' }],
        'tiny': ['12px', { lineHeight: '1.4', fontWeight: '500' }],

        // Labels (minimum 11px for accessibility)
        'label': ['11px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '600' }],

        // Legacy font sizes
        'display-1': ['56px', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-2': ['36px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-3': ['28px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading-1': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'heading-2': ['20px', { lineHeight: '1.25', fontWeight: '600' }],
        'heading-3': ['18px', { lineHeight: '1.3', fontWeight: '600' }],
      },

      // ═══════════════════════════════════════════════════════
      // SHADOWS
      // Subtle, warm-tinted, creates depth without weight
      // ═══════════════════════════════════════════════════════
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'sm': '0 2px 4px rgba(0, 0, 0, 0.04)',
        'DEFAULT': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'md': '0 6px 20px rgba(0, 0, 0, 0.06)',
        'lg': '0 12px 32px rgba(0, 0, 0, 0.08)',
        'xl': '0 24px 48px rgba(0, 0, 0, 0.1)',

        // Specific use cases
        'card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'button': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 4px 24px rgba(0, 0, 0, 0.12)',
        'modal': '0 16px 48px rgba(0, 0, 0, 0.16)',

        // Header
        'header-scroll': '0 1px 0 rgba(0, 0, 0, 0.05)',

        // Inner shadow for inputs
        'inner': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',

        // No shadow
        'none': 'none',
      },

      // ═══════════════════════════════════════════════════════
      // BORDER RADIUS
      // Consistent, slightly rounded
      // ═══════════════════════════════════════════════════════
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
        'pill': '9999px',
      },

      // ═══════════════════════════════════════════════════════
      // SPACING
      // Generous, breathable
      // ═══════════════════════════════════════════════════════
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },

      // ═══════════════════════════════════════════════════════
      // TRANSITIONS
      // Smooth, not snappy
      // ═══════════════════════════════════════════════════════
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
        '600': '600ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      // ═══════════════════════════════════════════════════════
      // MAX WIDTHS
      // ═══════════════════════════════════════════════════════
      maxWidth: {
        'content': '1200px',
        'wide': '1440px',
        'container': '1600px',
        'prose': '65ch',
      },

      animation: {
        'scroll': 'scroll 40s linear infinite',
        'scroll-reverse': 'scroll-reverse 40s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'scroll-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.no-scrollbar::-webkit-scrollbar': {
          display: 'none',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-hide::-webkit-scrollbar': {
          display: 'none',
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
      })
    }
  ],
}

export default config
