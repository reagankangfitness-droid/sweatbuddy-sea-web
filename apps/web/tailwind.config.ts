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
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['var(--font-clash)', 'var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['var(--font-clash)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-clash)', 'monospace'],
      },
      // Premium Typography Scale
      fontSize: {
        // Display sizes (for headlines) - tight leading, negative tracking
        'display-2xl': ['4.5rem', { lineHeight: '0.95', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['3.75rem', { lineHeight: '0.95', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-xs': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],

        // Body sizes - relaxed leading for readability
        'body-xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-md': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0' }],

        // UI sizes - snug leading for buttons/labels
        'ui-lg': ['1rem', { lineHeight: '1.25', letterSpacing: '0.01em', fontWeight: '500' }],
        'ui-md': ['0.875rem', { lineHeight: '1.25', letterSpacing: '0.01em', fontWeight: '500' }],
        'ui-sm': ['0.75rem', { lineHeight: '1.25', letterSpacing: '0.01em', fontWeight: '500' }],

        // Label sizes (uppercase eyebrows) - wide tracking
        'label-lg': ['0.875rem', { lineHeight: '1', letterSpacing: '0.08em', fontWeight: '600' }],
        'label-md': ['0.75rem', { lineHeight: '1', letterSpacing: '0.08em', fontWeight: '600' }],
        'label-sm': ['0.625rem', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '600' }],
      },
      letterSpacing: {
        'tightest': '-0.03em',
        'tighter': '-0.02em',
        'tight': '-0.01em',
        'normal': '0',
        'wide': '0.01em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
      lineHeight: {
        'none': '1',
        'tightest': '0.95',
        'tight': '1.1',
        'snug': '1.25',
        'normal': '1.5',
        'relaxed': '1.6',
        'loose': '1.75',
      },
      colors: {
        // ═══════════════════════════════════════════════
        // WARM DUSK COLOR PALETTE
        // ═══════════════════════════════════════════════

        // NEUTRALS (Warm forest-tinted grayscale)
        'forest': {
          950: '#0F1A17',  // Darkest - footer bg, dark overlays
          900: '#1B2B27',  // Primary text, headers
          800: '#2A3F39',  // Strong emphasis
          700: '#3D5A54',  // Secondary text, subheadings
          600: '#527069',  // Medium emphasis
          500: '#6B8F87',  // Tertiary text, placeholders, icons
          400: '#8AADA5',  // Muted elements
          300: '#A8C5BE',  // Borders, dividers, disabled
          200: '#D0E0DB',  // Light borders, hover states
          100: '#E8EFEC',  // Subtle backgrounds, hover fills
          50:  '#F4F7F6',  // Lightest tint
        },

        // BACKGROUNDS
        'sand': '#F7F4F0',     // Main page background
        'cream': '#FFFDFB',    // Card backgrounds, elevated surfaces
        'mist': '#E8EFEC',     // Subtle section backgrounds

        // PRIMARY ACCENT - Burnt Coral
        'coral': {
          DEFAULT: '#E07A5F',  // Primary CTA, main accent
          50:  '#FEF5F2',      // Lightest tint (backgrounds)
          100: '#FCE8E2',      // Light tint
          200: '#F9CFC3',      // Soft accent
          300: '#F4A89A',      // Light accent
          400: '#EA9177',      // Medium
          500: '#E07A5F',      // DEFAULT - Primary buttons
          600: '#C65D45',      // Hover state
          700: '#A84A36',      // Pressed state
          800: '#8A3D2D',      // Dark accent
          900: '#6E3326',      // Darkest
        },

        // SECONDARY ACCENTS
        'amber': {
          DEFAULT: '#F4A261',  // Badges, highlights, warnings
          light: '#F8C291',
          dark: '#E08A3C',
        },

        'teal': {
          DEFAULT: '#2A9D8F',  // Success, "Going" state, positive
          light: '#3DB9A9',
          dark: '#228176',
        },

        'ocean': {
          DEFAULT: '#264653',  // Premium, special events, deep accent
          light: '#3A6375',
          dark: '#1A323C',
        },

        // Legacy colors (keeping for compatibility)
        navy: '#0F172A',
        terracotta: '#E07A5F',
        electric: '#4F46E5',
        mint: '#10B981',

        // Dark theme base
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Accent colors
        accent: {
          teal: '#2A9D8F',
          purple: '#B292E7',
          orange: '#F4A261',
          yellow: '#FACC15',
          pink: '#EC4899',
          green: '#2A9D8F',
          blue: '#264653',
        },

        // Borders
        border: 'hsl(var(--border))',
        'border-light': 'hsl(var(--border-light))',
        'border-subtle': 'hsl(var(--border-subtle))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Primary
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
        },

        // Secondary
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        // Semantic
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: '#2A9D8F',
          foreground: 'hsl(0 0% 100%)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        // Cards & Popovers
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // Semantic background colors
      backgroundColor: {
        'page': '#F7F4F0',
        'card-surface': '#FFFDFB',
        'elevated': '#FFFFFF',
        'muted-bg': '#E8EFEC',
        'footer': '#0F1A17',
      },

      // Semantic text colors
      textColor: {
        'primary-text': '#1B2B27',
        'secondary-text': '#3D5A54',
        'tertiary-text': '#6B8F87',
        'muted-text': '#A8C5BE',
        'inverse-text': '#FFFDFB',
      },

      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
        pill: '52px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        // Warm-tinted shadows
        'sm': '0 1px 2px 0 rgba(27, 43, 39, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(27, 43, 39, 0.1), 0 1px 2px -1px rgba(27, 43, 39, 0.1)',
        'md': '0 4px 6px -1px rgba(27, 43, 39, 0.1), 0 2px 4px -2px rgba(27, 43, 39, 0.1)',
        'lg': '0 10px 15px -3px rgba(27, 43, 39, 0.1), 0 4px 6px -4px rgba(27, 43, 39, 0.1)',
        'xl': '0 20px 25px -5px rgba(27, 43, 39, 0.1), 0 8px 10px -6px rgba(27, 43, 39, 0.1)',
        'card': '0 2px 8px -2px rgba(27, 43, 39, 0.08), 0 4px 16px -4px rgba(27, 43, 39, 0.12)',
        'card-hover': '0 8px 24px -4px rgba(27, 43, 39, 0.12), 0 4px 8px -2px rgba(27, 43, 39, 0.08)',

        // Legacy shadows
        'brutal': '4px 4px 0px 0px #1B2B27',
        'brutal-sm': '2px 2px 0px 0px #1B2B27',
        'brutal-lg': '6px 6px 0px 0px #1B2B27',
        'brutal-coral': '4px 4px 0px 0px #E07A5F',
        'brutal-teal': '4px 4px 0px 0px #2A9D8F',

        // Glow effects
        'glow-coral': '0 0 30px -5px rgba(224, 122, 95, 0.4)',
        'glow-teal': '0 0 30px -5px rgba(42, 157, 143, 0.4)',

        // Header
        'header-scroll': '0 4px 20px rgba(27, 43, 39, 0.1)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'brutal': 'cubic-bezier(0.2, 0, 0, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1200': '1200ms',
      },
      maxWidth: {
        'container': '1280px',
      },
      animation: {
        'scroll': 'scroll 40s linear infinite',
        'scroll-reverse': 'scroll-reverse 40s linear infinite',
        'marquee': 'marquee 25s linear infinite',
        'marquee-reverse': 'marquee-reverse 25s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in': 'slideIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
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
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'scale(1.1)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 0deg, var(--tw-gradient-stops))',
        'gradient-warm': 'linear-gradient(to bottom right, #FEF5F2, rgba(244, 162, 97, 0.1))',
        'gradient-hero': 'linear-gradient(to bottom, #F7F4F0, #F7F4F0, #E8EFEC)',
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
      })
    }
  ],
}

export default config
