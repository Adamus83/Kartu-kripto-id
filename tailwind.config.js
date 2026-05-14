/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          purple: '#9333ea',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          pink: '#ec4899',
          green: '#22c55e',
          yellow: '#eab308',
          orange: '#f97316',
        },
        dark: {
          950: '#030712',
          900: '#0a0a1a',
          800: '#0f0f2e',
          700: '#1a1a3e',
          600: '#252550',
          500: '#2d2d6b',
        },
        rarity: {
          common: '#6b7280',
          rare: '#3b82f6',
          epic: '#9333ea',
          legendary: '#f59e0b',
        }
      },
      fontFamily: {
        game: ['system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'holographic': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #06b6d4 50%, #9333ea 75%, #ec4899 100%)',
        'card-common': 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        'card-rare': 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)',
        'card-epic': 'linear-gradient(135deg, #3b1f6b 0%, #7c3aed 100%)',
        'card-legendary': 'linear-gradient(135deg, #6b3f00 0%, #d97706 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulse_glow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        particle: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) scale(0)', opacity: '0' },
        }
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3s ease-in-out infinite',
        pulse_glow: 'pulse_glow 2s ease-in-out infinite',
        flip: 'flip 0.6s ease-in-out',
        particle: 'particle 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
}
