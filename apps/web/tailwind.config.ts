import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1a2e4a', light: '#243d61', dark: '#0f1e30' },
        gold:  { DEFAULT: '#c9a84c', light: '#e8c97a', dark: '#8b6914' },
        board: {
          'light-wood': '#f0d9b5', 'dark-wood': '#b58863',
          'light-green': '#e8f0e9', 'dark-green': '#4a7c59',
          'light-slate': '#e8e4d9', 'dark-slate': '#86a666',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Crimson Pro', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
