/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f6f6',
          100: '#dcebe9',
          200: '#b9d6d3',
          300: '#8fbcb7',
          400: '#5f9d97',
          500: '#3f827b',
          600: '#2f6b64',
          700: '#275650',
          800: '#214542',
          900: '#1c3a38',
          950: '#0e2120',
        },
        sand: {
          50: '#fbf9f4',
          100: '#f4efe2',
          200: '#e8ddc4',
          300: '#d8c69c',
          400: '#c7ab74',
          500: '#b8925a',
          600: '#a67a4a',
          700: '#89613e',
          800: '#6f4f37',
          900: '#5b4230',
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
