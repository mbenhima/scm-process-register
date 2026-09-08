/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orange: { DEFAULT: '#F8931D', deep: '#E07B00', tint: '#FDEEDA' },
        grey: { dark: '#3A3A3C', ink: '#58595B', medium: '#808184', light: '#F2F2F3', line: '#E3E3E4' },
        bg: '#FDFDFC',
        overlayBlue: '#3A6EA5',
        overlayGreen: '#5AA469',
        status: {
          red: '#F4C7C3', amber: '#FBE0B5', yellow: '#FFF3B0', green: '#D9EAD3', darkgreen: '#B6D7A8',
        },
      },
      fontFamily: {
        title: ['Cambria', 'Georgia', 'Times New Roman', 'serif'],
        body: ['Calibri', 'Carlito', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(58,58,60,0.08), 0 1px 2px rgba(58,58,60,0.06)',
      },
      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [],
};
