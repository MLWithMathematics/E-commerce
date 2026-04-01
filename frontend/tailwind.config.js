// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#1a1f2e', light: '#2d3448' },
        accent:   { DEFAULT: '#f59e0b', dark: '#d97706' },
        surface:  { DEFAULT: '#ffffff', dark: '#1e2436' },
        muted:    '#6b7280',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.08)',
        glow: '0 0 0 3px rgba(245,158,11,0.3)',
      },
    },
  },
  plugins: [],
}
