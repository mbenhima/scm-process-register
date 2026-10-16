// Reads a design token from the CSS custom properties (NFR-DA-VDS-01): code that needs a color
// value (a color input, a third-party renderer) takes it from the token file, never writes it.
export function token(name) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim().toUpperCase();
}
