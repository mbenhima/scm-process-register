/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5bbfd',
          400: '#8194fb',
          500: '#6471f5',
          600: '#4f52e8',
          700: '#4241cd',
          800: '#3636a6',
          900: '#2f3183',
          950: '#1c1d4d',
        },
        surface: '#f8f9fc',
      },
    },
  },
  plugins: [],
}
