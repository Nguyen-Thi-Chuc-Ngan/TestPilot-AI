import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover:     { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        // Neon brand
        neon: {
          purple: '#a78bfa',
          blue:   '#60a5fa',
          green:  '#34d399',
          red:    '#f87171',
          cyan:   '#22d3ee',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid':        'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)',
        'glow-purple':       'radial-gradient(ellipse at center, rgba(124,58,237,0.3) 0%, transparent 70%)',
        'glow-blue':         'radial-gradient(ellipse at center, rgba(59,130,246,0.25) 0%, transparent 70%)',
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(124,58,237,0.4), 0 0 40px rgba(124,58,237,0.15)',
        'neon-blue':   '0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.15)',
        'neon-green':  '0 0 15px rgba(34,197,94,0.4)',
        'neon-red':    '0 0 15px rgba(239,68,68,0.5)',
        'glass':       '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover':  '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(124,58,237,0.1)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'radar':      'radar 3s linear infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'scan':       'scan 2s linear infinite',
        'blink':      'blink 1s step-end infinite',
        'counter':    'counter 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 10px rgba(124,58,237,0.4)' },
          '50%':      { boxShadow: '0 0 30px rgba(124,58,237,0.7), 0 0 60px rgba(124,58,237,0.2)' },
        },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        radar:   { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        scan:    { from: { top: '-2px' }, to: { top: '100%' } },
        blink:   { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        counter: { from: { transform: 'translateY(100%)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
