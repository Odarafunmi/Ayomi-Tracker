import type { Config } from 'tailwindcss';

/**
 * Ayomi Tracker style guide v2 (Burgundy & Cream) — design tokens.
 * 60% cream canvas, 30% burgundy anchor, 10% interactive phase colours.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#F8F0E3', deep: '#EFE1CD' },
        blush: '#F2D6CF',
        surface: '#FFFBF5',
        burgundy: { DEFAULT: '#6D1A36', deep: '#3A0C1C', soft: '#9A3355' },
        muted: '#7A5C60',
        phase: {
          menstrual: '#D6336C',
          follicular: '#2BB3A3',
          ovulation: '#F2A33A',
          luteal: '#9B7EDE',
        },
        success: '#2BB3A3',
        notice: '#F2A33A',
        error: '#C0392B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: { card: '32px', tile: '28px' },
      boxShadow: {
        glow: '0 12px 32px -12px rgb(109 26 54 / .30)',
        pill: '0 10px 28px -12px rgb(109 26 54 / .28)',
        'nav-active': '0 8px 20px -6px rgb(109 26 54 / .55)',
      },
      backgroundImage: {
        canvas: 'linear-gradient(160deg, #FCFAF6 0%, #F6EEE3 100%)',
        anchor: 'linear-gradient(145deg, #3A0C1C 0%, #6D1A36 100%)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '.65' },
        },
        stripes: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '22.63px 0' },
        },
        drift: {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 2.4s ease-in-out infinite',
        stripes: 'stripes 1.1s linear infinite',
        'drift-slow': 'drift 9s linear infinite',
        'drift-slower': 'drift 12s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
