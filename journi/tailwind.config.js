/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // POWERACT Consulting's palette — the same teal/orange/ink system
        // used across every journi deliverable (frameworks guides, archetype
        // decks, the SRS): deep teal #15423A, teal #1F6459, orange accent
        // #C2661C, ink #16221F. brand-600/700 and sand-500/100 below are
        // pinned to those exact values so this app and every other journi
        // artifact read as one consistent brand, not two different products.
        brand: {
          50: '#f1f6f6',
          100: '#dcebe9',
          200: '#b9d6d3',
          300: '#8fbcb7',
          400: '#5f9d97',
          500: '#2c7a6b',
          600: '#1f6459', // POWERACT teal
          700: '#15423a', // POWERACT deep teal
          800: '#123830',
          900: '#0e2b25',
          950: '#081d19',
        },
        sand: {
          50: '#fdf5ee',
          100: '#f7e4d2', // POWERACT orange, light tint
          200: '#edc79f',
          300: '#e0a468',
          400: '#d1863f',
          500: '#c2661c', // POWERACT orange accent
          600: '#a85416',
          700: '#854313',
          800: '#6b3712',
          900: '#572d10',
        },
        surface: '#f7f8f7',
        ink: '#16221f',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
