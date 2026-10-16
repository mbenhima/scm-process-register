// Amounts with their currency (FR-DA-I18N-09, NFR-DA-I18N-05): formatted by the user's locale
// with the ISO code; a total is given per currency, never added across currencies.
const LOCALE = { en: 'en-GB', fr: 'fr-FR', ar: 'ar-MA' };
export function fmtMoney(amount, currency, lang = 'en') {
  if (amount === null || amount === undefined || amount === '') return '';
  try { return new Intl.NumberFormat(LOCALE[lang] || 'en-GB', { style: 'currency', currency: currency || 'USD', currencyDisplay: 'code', maximumFractionDigits: 2 }).format(+amount); } catch { return `${currency || ''} ${amount}`; }
}
export function totalsByCurrency(items, amount, currency, lang = 'en') {
  const sums = new Map();
  for (const x of items) { const a = +x[amount]; if (!a) continue; const c = x[currency] || 'USD'; sums.set(c, (sums.get(c) || 0) + a); }
  return [...sums.entries()].map(([c, a]) => fmtMoney(a, c, lang));
}
