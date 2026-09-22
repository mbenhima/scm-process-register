/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#F8931D',
          deep: '#E07B00',
          tint: '#FDEEDA',
        },
        grey: {
          dark: '#3A3A3C',
          ink: '#58595B',
          medium: '#808184',
          light: '#F2F2F3',
          line: '#E3E3E4',
        },
        bg: '#FDFDFC',
      },
      fontFamily: {
        serif: ['Cambria', 'Georgia', 'serif'],
        sans: ['Calibri', 'Segoe UI', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
