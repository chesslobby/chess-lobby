/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy:   '#1a2e4a',
        gold:   '#b8860b',
        'gold-light': '#e8c97a',
        'gold-dark':  '#8b6914',
        cream:  '#f5f0e8',
        parchment: '#ede6d3',
        'wood-dark': '#2c1810',
        'wood-mid':  '#5c3317',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['Crimson Pro', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'speak-ring': 'speakPulse 0.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
