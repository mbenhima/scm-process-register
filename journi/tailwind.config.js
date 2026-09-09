/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // POWERACT Consulting's real brand — from the company's own
        // "Brand & Graphical Chart Guide" (Aug 2026, v1.0): one orange accent
        // (Primary #F8931D, Deep #E07B00, Tint #FDEEDA) used sparingly for
        // emphasis, on a light/white background, with charcoal greys — not
        // black — for everything else (Grey Dark #3A3A3C, Grey Ink #58595B,
        // Grey Medium #808184, Grey Light #F2F2F3, Grey Line #E3E3E4).
        //
        // journi's existing components/pages reference this scale by numeric
        // shade (brand-50, brand-600, brand-950, ...) at ~350 call sites, so
        // rather than a smooth single-hue gradient, this ramp is organised by
        // *purpose*, matching how those call sites already use each shade:
        // the lightest and darkest steps carry the neutral greys used for
        // chrome, borders and text (where the guide asks for grey, not
        // orange), while the middle steps carry the two brand oranges used
        // for buttons, active states, links and other real emphasis.
        brand: {
          50: '#fdeeda', // Orange Tint (exact) — hover/active/highlighted light surfaces
          100: '#e7e7e8', // neutral divider — default borders, card/modal edges
          200: '#d8d8da', // neutral, one step darker — scrollbar thumb, hover borders
          300: '#fbbb6e', // light orange — selection rings, accent dots
          400: '#f8a63d', // mid orange — focus rings, stronger hover accents
          500: '#faa22e', // orange — progress bars, bar-chart fills
          600: '#f8931d', // Orange Primary (exact) — buttons, active nav, primary emphasis
          700: '#e07b00', // Orange Deep (exact) — button hover, KPI numbers, eyebrow labels
          800: '#58595b', // Grey Ink (exact) — secondary text, meta labels
          900: '#3a3a3c', // Grey Dark (exact) — headings, strong text
          950: '#2a2a2c', // near-black grey — heaviest headings, hero gradient
        },
        // Neutral grey scale for generic tags/badges and muted UI — same
        // greys as above, kept separate so a component can ask for "the
        // neutral treatment" without depending on brand's orange steps.
        sand: {
          50: '#fafafa',
          100: '#f2f2f3', // Grey Light (exact)
          200: '#e3e3e4', // Grey Line (exact)
          300: '#c7c7c9',
          400: '#a6a6a8',
          500: '#808184', // Grey Medium (exact)
          600: '#58595b', // Grey Ink (exact)
          700: '#58595b',
          800: '#3a3a3c', // Grey Dark (exact)
          900: '#2a2a2c',
        },
        // Muted multi-series chart colors, per the guide's rule for 3+ series
        // overlays: brand orange plus a desaturated blue and green so neither
        // fights the primary accent.
        chartblue: { 400: '#5c8ab8', 500: '#3a6ea5', 600: '#2e5883' },
        chartgreen: { 400: '#7cb88a', 500: '#5aa469', 600: '#498756' },
        surface: '#fdfdfc', // Background (exact) — page/app background, always light
        ink: '#3a3a3c', // Grey Dark (exact) — default body text color

        // Semantic status/maturity scale (guide Section 6.2) — red-to-green,
        // the one place a non-brand color range is intentional. Only the
        // light tint shades (50/100/200) used for badge/callout backgrounds
        // are pinned to the guide's exact hex codes; the darker shades used
        // for readable text/icons keep Tailwind's own defaults, which are
        // already muted enough not to fight the brand orange.
        red: { 50: '#fdf1f0', 100: '#fae1df', 200: '#f4c7c3' }, // Red (worst)
        amber: { 50: '#fff8ec', 100: '#fdedd2', 200: '#fbe0b5' }, // Amber
        yellow: { 50: '#fffbe8', 100: '#fff6c2', 200: '#fff3b0' }, // Yellow
        emerald: { 50: '#eef6ec', 100: '#dcedd7', 200: '#d9ead3' }, // Green
        green: { 50: '#eef6ec', 100: '#dcedd7', 200: '#d9ead3' }, // Green (alias)
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
