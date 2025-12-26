/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          DEFAULT: '#000000',
          paper: '#ffffff',
          zinc: '#121214',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#ffffff',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'float-slow': 'float 25s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 4s infinite ease-in-out',
        'draw-in': 'drawIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'glass-shine': 'glassShine 4s infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(1%, 2%) scale(1.02)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.1', transform: 'scale(1)' },
          '50%': { opacity: '0.15', transform: 'scale(1.02)' },
        },
        drawIn: {
          'from': {
            opacity: '0',
            filter: 'blur(8px)',
            transform: 'translateY(10px) scale(0.98)',
          },
          'to': { opacity: '1', filter: 'blur(0)', transform: 'translateY(0) scale(1)' },
        },
        glassShine: {
          '0%': { transform: 'translateX(-100%) skewX(-15deg)' },
          '100%': { transform: 'translateX(200%) skewX(-15deg)' },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(5px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        scanBeam: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        pulseGlowGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 215, 0, 0)', transform: 'scale(1)' },
          '50%': { boxShadow: '0 0 20px 5px rgba(255, 215, 0, 0.4)', transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
}
