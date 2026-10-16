// Amounts and currencies (FR-DA-I18N-09, NFR-DA-I18N-05): every amount carries its currency,
// an organization sets its default currency and the currencies it enables, and a total never
// adds amounts of different currencies — it is given per currency.
import { get, P } from '../db.js';
import { HttpError } from '../http.js';

export const CURRENCIES = ['MAD', 'EUR', 'USD', 'GBP', 'ZAR', 'CHF', 'CAD', 'AED', 'SAR', 'XOF', 'TND', 'DZD', 'EGP'];
const LOCALE = { en: 'en-GB', fr: 'fr-FR', ar: 'ar-MA' };

export function orgCurrencies(orgOrId) {
  const o = typeof orgOrId === 'string' ? get('SELECT currency, currencies, country FROM organizations WHERE id=?', orgOrId) : orgOrId;
  const def = CURRENCIES.includes(o?.currency) ? o.currency : 'USD';
  const list = (P(o?.currencies) || []).filter(c => CURRENCIES.includes(c));
  return { default: def, enabled: [...new Set([def, ...list])] };
}
/** The currency of an amount typed by a user: one the organization enables, else its default. */
export function currencyFor(orgId, given) {
  const c = orgCurrencies(orgId);
  if (!given) return c.default;
  const g = String(given).toUpperCase();
  if (!c.enabled.includes(g)) throw new HttpError(400, 'CURRENCY_NOT_ENABLED', `The currency ${g} is not enabled for the organization (${c.enabled.join(', ')}).`);
  return g;
}
export function fmtMoney(amount, currency, lang = 'en') {
  if (amount === null || amount === undefined || amount === '') return '';
  try { return new Intl.NumberFormat(LOCALE[lang] || 'en-GB', { style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 2 }).format(+amount); } catch { return `${currency} ${amount}`; }
}
/** Totals per currency, never added across currencies: "MAD 12,000.00 · EUR 3,000.00". */
export function totalsByCurrency(items, amount, currency, lang = 'en', fallback = 'USD') {
  const sums = new Map();
  for (const x of items) { const a = +(typeof amount === 'function' ? amount(x) : x[amount]); if (!a) continue; const c = (typeof currency === 'function' ? currency(x) : x[currency]) || fallback; sums.set(c, (sums.get(c) || 0) + a); }
  return [...sums.entries()].map(([c, a]) => fmtMoney(a, c, lang)).join(' · ') || fmtMoney(0, fallback, lang);
}
