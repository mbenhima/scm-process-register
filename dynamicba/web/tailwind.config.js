/** @type {import('tailwindcss').Config} */
// Every color resolves to a CSS custom property defined in src/index.css (the
// DynamicBA design tokens) via the rgb(var(...) / <alpha-value>) pattern, so
// opacity modifiers like bg-orange/10 keep working without a second hex value
// anywhere. Nothing in here or in a component should ever hold a raw hex code.
function token(name) {
  return `rgb(var(${name}) / <alpha-value>)`
}

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: token('--pa-orange'),
          deep: token('--pa-orange-deep'),
          tint: token('--pa-orange-tint'),
        },
        grey: {
          dark: token('--pa-grey-dark'),
          ink: token('--pa-grey-ink'),
          medium: token('--pa-grey-medium'),
          light: token('--pa-grey-light'),
          line: token('--pa-grey-line'),
        },
        bg: token('--pa-bg'),
        danger: token('--pa-danger'),
        success: token('--pa-success'),
        status: {
          1: token('--pa-status-1'),
          2: token('--pa-status-2'),
          3: token('--pa-status-3'),
          4: token('--pa-status-4'),
          5: token('--pa-status-5'),
        },
        'status-text': {
          1: token('--pa-status-1-text'),
          2: token('--pa-status-2-text'),
          3: token('--pa-status-3-text'),
          4: token('--pa-status-4-text'),
          5: token('--pa-status-5-text'),
        },
        chart: {
          blue: token('--pa-chart-blue'),
          green: token('--pa-chart-green'),
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Cambria', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'Calibri', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
      },
      borderRadius: {
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(58 58 60 / 0.04), 0 2px 8px rgb(58 58 60 / 0.06)',
      },
    },
  },
  plugins: [],
}
