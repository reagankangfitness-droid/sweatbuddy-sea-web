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
      },
      colors: {
        // Neo-Brutalist Color Palette
        navy: '#0F172A',
        sand: '#FAF7F2',
        terracotta: '#E07A5F',
        coral: '#FF6B6B',
        electric: '#4F46E5',
        mint: '#10B981',
        cream: '#FFFBEB',

        // Dark theme base
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Accent colors
        accent: {
          teal: '#3CCFBB',
          purple: '#B292E7',
          orange: '#F97316',
          yellow: '#FACC15',
          pink: '#EC4899',
          green: '#22C55E',
          blue: '#3B82F6',
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
          DEFAULT: 'hsl(var(--success))',
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
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
        pill: '52px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        // Neo-Brutalist hard shadows
        'brutal': '4px 4px 0px 0px #0F172A',
        'brutal-sm': '2px 2px 0px 0px #0F172A',
        'brutal-lg': '6px 6px 0px 0px #0F172A',
        'brutal-xl': '8px 8px 0px 0px #0F172A',
        'brutal-terracotta': '4px 4px 0px 0px #E07A5F',
        'brutal-electric': '4px 4px 0px 0px #4F46E5',
        'brutal-mint': '4px 4px 0px 0px #10B981',

        // Dark theme shadows with glow effects
        'glow-teal': '0 0 30px -5px rgba(60, 207, 187, 0.4)',
        'glow-purple': '0 0 30px -5px rgba(178, 146, 231, 0.4)',
        'glow-orange': '0 0 30px -5px rgba(249, 115, 22, 0.4)',
        'glow-pink': '0 0 30px -5px rgba(236, 72, 153, 0.4)',

        // Card shadows
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 60px -15px rgba(60, 207, 187, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',

        // Header
        'header-scroll': '0 4px 20px rgba(0, 0, 0, 0.3)',
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
