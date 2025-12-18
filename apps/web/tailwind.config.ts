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
      // FONTS - Plus Jakarta Sans (Airbnb Cereal alternative)
      // ═══════════════════════════════════════════════════════
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },

      // ═══════════════════════════════════════════════════════
      // AIRBNB-STYLE FONT SIZES
      // Clear size scale with consistent line-heights
      // ═══════════════════════════════════════════════════════
      fontSize: {
        // Display sizes
        'display-1': ['48px', { lineHeight: '52px', fontWeight: '800', letterSpacing: '-0.02em' }],
        'display-2': ['32px', { lineHeight: '36px', fontWeight: '800', letterSpacing: '-0.02em' }],
        'display-3': ['26px', { lineHeight: '30px', fontWeight: '600', letterSpacing: '-0.01em' }],

        // Heading sizes
        'heading-1': ['22px', { lineHeight: '26px', fontWeight: '600' }],
        'heading-2': ['18px', { lineHeight: '22px', fontWeight: '600' }],
        'heading-3': ['16px', { lineHeight: '20px', fontWeight: '600' }],

        // Body sizes
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],

        // Caption/Label
        'caption': ['12px', { lineHeight: '16px', fontWeight: '600' }],
        'overline': ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.04em' }],
      },

      // ═══════════════════════════════════════════════════════
      // AIRBNB COLOR PALETTE
      // Simple: black, grays, white, one accent
      // ═══════════════════════════════════════════════════════
      colors: {
        // Neutrals (Airbnb uses warm blacks)
        'gray': {
          50: '#F7F7F7',
          100: '#EBEBEB',
          200: '#DDDDDD',
          300: '#C2C2C2',
          400: '#A3A3A3',
          500: '#858585',
          600: '#6A6A6A',
          700: '#484848',
          800: '#222222',
          900: '#111111',
        },

        // Primary accent (coral/terracotta for SweatBuddies)
        'primary': {
          DEFAULT: '#E07A5F',
          foreground: '#FFFFFF',
          hover: '#D15A3E',
          50: '#FEF5F2',
          100: '#FCE8E2',
          200: '#F9D0C4',
          300: '#F4A89A',
          400: '#EA8F79',
          500: '#E07A5F',
          600: '#D15A3E',
          700: '#B14832',
          800: '#8E3A29',
          900: '#6E3326',
        },

        // Success (for "Going" states)
        'success': {
          DEFAULT: '#008A05',
          light: '#E6F7E6',
        },

        // Legacy compatibility colors
        'coral': {
          DEFAULT: '#E07A5F',
          50: '#FEF5F2',
          100: '#FCE8E2',
          200: '#F9D0C4',
          300: '#F4A89A',
          400: '#EA8F79',
          500: '#E07A5F',
          600: '#D15A3E',
          700: '#B14832',
          800: '#8E3A29',
          900: '#6E3326',
        },
        'teal': {
          DEFAULT: '#2A9D8F',
          light: '#3DB9A9',
          dark: '#228176',
        },
        'forest': {
          50: '#F7F7F7',
          100: '#EBEBEB',
          200: '#DDDDDD',
          300: '#C2C2C2',
          400: '#A3A3A3',
          500: '#858585',
          600: '#6A6A6A',
          700: '#484848',
          800: '#222222',
          900: '#111111',
          950: '#0A0A0A',
        },
        'sand': '#F7F7F7',
        'cream': '#FFFFFF',
        'mist': '#F7F7F7',
        'ocean': {
          DEFAULT: '#264653',
          light: '#3A6375',
          dark: '#1A323C',
        },
        'amber': {
          DEFAULT: '#F4A261',
          light: '#F8C291',
          dark: '#E08A3C',
        },

        // Background
        'background': '#FFFFFF',
        'surface': '#F7F7F7',

        // Legacy
        navy: '#222222',
        terracotta: '#E07A5F',
        electric: '#4F46E5',
        mint: '#008A05',

        // Accent colors
        accent: {
          teal: '#2A9D8F',
          purple: '#B292E7',
          orange: '#F4A261',
          yellow: '#FACC15',
          pink: '#EC4899',
          green: '#008A05',
          blue: '#264653',
        },

        // Borders
        border: '#DDDDDD',
        'border-light': '#EBEBEB',
        'border-subtle': '#F7F7F7',
        input: '#DDDDDD',
        ring: '#222222',

        // Secondary
        secondary: {
          DEFAULT: '#F7F7F7',
          foreground: '#222222',
        },

        // Semantic
        destructive: {
          DEFAULT: '#E07A5F',
          foreground: '#FFFFFF',
        },

        muted: {
          DEFAULT: '#F7F7F7',
          foreground: '#6A6A6A',
        },

        // Cards & Popovers
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#222222',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#222222',
        },
      },

      // ═══════════════════════════════════════════════════════
      // AIRBNB-STYLE SPACING
      // Generous, consistent increments
      // ═══════════════════════════════════════════════════════
      spacing: {
        '18': '72px',
        '22': '88px',
        '26': '104px',
        '30': '120px',
      },

      // ═══════════════════════════════════════════════════════
      // AIRBNB-STYLE SHADOWS
      // Soft, diffused, subtle
      // ═══════════════════════════════════════════════════════
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.08)',
        'DEFAULT': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'lg': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'xl': '0 8px 28px rgba(0, 0, 0, 0.12)',

        // Card shadows
        'card': '0 1px 2px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 2px 4px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.12)',

        // Button shadow
        'button': '0 1px 2px rgba(0, 0, 0, 0.08)',

        // Modal/Dropdown
        'modal': '0 4px 32px rgba(0, 0, 0, 0.16)',

        // Header
        'header-scroll': '0 1px 0 rgba(0, 0, 0, 0.08)',
      },

      // ═══════════════════════════════════════════════════════
      // AIRBNB-STYLE BORDER RADIUS
      // Consistently rounded
      // ═══════════════════════════════════════════════════════
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
        'pill': '9999px',
      },

      // ═══════════════════════════════════════════════════════
      // TRANSITIONS
      // ═══════════════════════════════════════════════════════
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
        '600': '600ms',
      },

      transitionTimingFunction: {
        'airbnb': 'cubic-bezier(0.2, 0, 0, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      maxWidth: {
        'container': '1760px',
      },

      animation: {
        'scroll': 'scroll 40s linear infinite',
        'scroll-reverse': 'scroll-reverse 40s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
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
      })
    }
  ],
}

export default config
