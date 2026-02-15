import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Orbitron', 'sans-serif'],
        headline: ['Orbitron', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-ripple': {
          '0%': { transform: 'scale(0.5)', opacity: '0.5' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'trace-in': {
          to: { strokeDashoffset: '0' },
        },
        'particle-in': {
          '0%': {
            cx: 'calc(100px + cos(var(--angle)) * 200px)',
            cy: 'calc(100px + sin(var(--angle)) * 200px)',
            opacity: '0',
          },
          '50%': { opacity: '1' },
          '100%': {
            cx: 'calc(100px + cos(var(--angle)) * var(--radius))',
            cy: 'calc(100px + sin(var(--angle)) * var(--radius))',
            opacity: '0',
          },
        },
        'text-in': {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
            filter: 'blur(5px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
            filter: 'blur(0)',
          },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(200%)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px hsl(var(--primary)), inset 0 0 10px hsl(var(--primary))' },
          '50%': { boxShadow: '0 0 35px hsl(var(--primary)), inset 0 0 15px hsl(var(--primary))' },
        },
        'waveform': {
          '0%, 100%': { transform: 'scale(0.95)', borderWidth: '1px', opacity: '0.7' },
          '50%': { transform: 'scale(1.05)', borderWidth: '2px', opacity: '0.3' },
        },
        'scanline-rotate': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        'ripple-out': {
          'from': { transform: 'scale(0.7)', opacity: '0.5' },
          'to': { transform: 'scale(1.2)', opacity: '0' },
        },
        'particle-float': {
          '0%': { transform: 'translateY(0px) translateX(0px) scale(1)', opacity: '0.7' },
          '50%': { transform: 'translateY(-20px) translateX(5px) scale(1.2)', opacity: '1' },
          '100%': { transform: 'translateY(0px) translateX(0px) scale(1)', opacity: '0.7' },
        },
        'holo-float': {
          '0%': { transform: 'translateY(50px) rotate(0deg)', opacity: '0' },
          '50%': { opacity: '0.3' },
          '100%': { transform: 'translateY(-50px) rotate(30deg)', opacity: '0' },
        },
        'fade-in-out': {
          '0%': { opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'grid-pulse': {
          '0%': { opacity: 0, transform: 'scale(1)' },
          '50%': { opacity: 0.1, transform: 'scale(1.05)' },
          '100%': { opacity: 0, transform: 'scale(1)' },
        },
        'orbit': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 1s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards',
        'spin-slow': 'spin-slow 25s linear infinite',
        'pulse-ripple': 'pulse-ripple 2s ease-out forwards',
        'trace-in': 'trace-in 2s cubic-bezier(0.215, 0.610, 0.355, 1.000) 1s forwards',
        'particle-in': 'particle-in var(--duration) cubic-bezier(0.25, 1, 0.5, 1) var(--delay) forwards',
        'text-in': 'text-in 1.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) 2.5s forwards',
        'scanline': 'scanline 1s linear 3s',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'waveform': 'waveform 1.2s ease-in-out infinite',
        'scanline-rotate': 'scanline-rotate 3s linear infinite',
        'ripple-out': 'ripple-out 1.5s ease-out forwards',
        'particle-float': 'particle-float linear infinite',
        'holo-float': 'holo-float 4s ease-in-out infinite',
        'fade-in-out': 'fade-in-out forwards',
        'flicker': 'flicker 2s linear infinite',
        'grid-pulse': 'grid-pulse 6s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
