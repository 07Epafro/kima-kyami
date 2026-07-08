import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#eadeca',
        noir: '#181818',
        gold: '#f7c480',
        muted: '#9a9a9a',
        // Admin — Kinetic Elegance
        'a-bone':     '#FBF9F5',
        'a-charcoal': '#1A1A1A',
        'a-gold':     '#D4AF37',
        'a-muted':    '#6B6B6B',
        'a-border':   '#DBDAD6',
      },
      fontFamily: {
        serif:   ['var(--font-serif)',   'Georgia', 'serif'],
        sans:    ['var(--font-sans)',    'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        ui:      ['var(--font-ui)',      'sans-serif'],
      },
      fontSize: {
        'hero': 'clamp(40px, 8vw, 76px)',
        'title-lg': 'clamp(28px, 4vw, 42px)',
        'title-md': 'clamp(22px, 3vw, 34px)',
        'nav-mobile': 'clamp(26px, 7vw, 40px)',
      },
      letterSpacing: {
        'spaced': '.12em',
        'spaced-lg': '.18em',
        'spaced-xl': '.22em',
        'spaced-max': '.35em',
      },
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [typography],
}

export default config
