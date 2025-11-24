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
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['var(--font-league-spartan)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        'border-light': 'hsl(var(--border-light))',
        'border-subtle': 'hsl(var(--border-subtle))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
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
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
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
        pill: '40px',
      },
      boxShadow: {
        // Premium depth system - Airbnb/ClassPass inspired
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'card-hover': '0 12px 32px rgba(0, 0, 0, 0.16)',
        'premium': '0 8px 20px rgba(0, 0, 0, 0.12)',
        'premium-hover': '0 16px 40px rgba(0, 0, 0, 0.16)',
        'soft': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'lifted': '0 4px 16px rgba(0, 0, 0, 0.10)',
        'button-glow': '0 2px 4px rgba(0, 102, 255, 0.3)',
        'button-glow-hover': '0 4px 12px rgba(0, 102, 255, 0.4)',
        'header-scroll': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        // Legacy Airbnb shadows (keeping for compatibility)
        'airbnb': '0 6px 16px rgba(0, 0, 0, 0.14)',
        'airbnb-hover': '0 8px 28px rgba(0, 0, 0, 0.18)',
      },
      transitionTimingFunction: {
        'airbnb': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      maxWidth: {
        'container': '1280px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
