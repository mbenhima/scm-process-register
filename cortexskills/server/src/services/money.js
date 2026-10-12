// Amounts and currencies (SRS 1.8 FR-DA-I18N-09, NFR-DA-I18N-05). Every amount carries its currency; an
// Organization sets its default currency and the currencies it enables; a total never adds amounts of different
// currencies without a stated conversion rate and date — without a rate, the subtotals per currency are shown.
import { all, one } from '../db.js';
import { J } from '../lib/util.js';

export const ISO_CURRENCIES = ['MAD', 'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AED', 'SAR', 'QAR', 'TND', 'DZD', 'EGP', 'XOF', 'XAF', 'JPY', 'CNY'];
const LOCALE = { en: 'en-US', fr: 'fr-FR', ar: 'ar-MA' };

export function orgCurrencies(orgId) {
  const c = one(`SELECT currency, currencies FROM org_config WHERE org_id=?`, orgId);
  const def = c?.currency || 'USD';
  const enabled = [...new Set([def, ...J(c?.currencies, []).filter(x => ISO_CURRENCIES.includes(x))])];
  return { default: def, enabled };
}

/** Latest rate from → to on or before the date, direct or inverse. */
export function rateFor(orgId, from, to, asOf = new Date().toISOString().slice(0, 10)) {
  if (from === to) return { rate: 1, as_of: asOf };
  const d = one(`SELECT rate, as_of FROM exchange_rates WHERE org_id=? AND from_cur=? AND to_cur=? AND as_of<=? ORDER BY as_of DESC LIMIT 1`, orgId, from, to, asOf);
  if (d) return { rate: d.rate, as_of: d.as_of };
  const i = one(`SELECT rate, as_of FROM exchange_rates WHERE org_id=? AND from_cur=? AND to_cur=? AND as_of<=? ORDER BY as_of DESC LIMIT 1`, orgId, to, from, asOf);
  return i && i.rate ? { rate: 1 / i.rate, as_of: i.as_of } : null;
}
export const listRates = orgId => all(`SELECT * FROM exchange_rates WHERE org_id=? ORDER BY from_cur, to_cur, as_of DESC`, orgId);

/** An amount with its currency, in the formats of the language (e.g. "1 250 000,00 MAD"). */
export function fmtMoney(n, cur, lang = 'en', { decimals } = {}) {
  const v = Number(n || 0); const d = decimals ?? (Number.isInteger(v) ? 0 : 2);
  const num = v.toLocaleString(LOCALE[lang] || 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return cur ? `${num} ${cur}` : num;
}

/**
 * Total of `key` over `items`, each in its own `currency` (else the default). One currency: a plain total. Several:
 * converted into the default currency with the rate and date stated in `note`; if a rate is missing, no total is
 * made and the subtotals per currency are returned in `text` ("12 000 MAD + 1 500 EUR").
 */
export function moneyTotal(orgId, items, key, lang = 'en', { asOf, currencyKey = 'currency' } = {}) {
  const { default: def } = orgCurrencies(orgId);
  const by = {}; for (const it of items) { const c = it[currencyKey] || def; by[c] = (by[c] || 0) + (Number(it[key]) || 0); }
  const curs = Object.keys(by); if (!curs.length) return { amount: 0, currency: def, text: fmtMoney(0, def, lang), note: '', converted: false };
  if (curs.length === 1) return { amount: by[curs[0]], currency: curs[0], text: fmtMoney(by[curs[0]], curs[0], lang), note: '', converted: false };
  const rates = curs.filter(c => c !== def).map(c => ({ from: c, ...(rateFor(orgId, c, def, asOf) || {}) }));
  if (rates.some(r => !r.rate)) return { amount: null, currency: null, byCurrency: by, text: curs.map(c => fmtMoney(by[c], c, lang)).join(' + '), note: NOTE.missing[lang] || NOTE.missing.en, converted: false };
  const amount = curs.reduce((s, c) => s + by[c] * (c === def ? 1 : rates.find(r => r.from === c).rate), 0);
  const note = (NOTE.conv[lang] || NOTE.conv.en).replace('{list}', rates.map(r => `1 ${r.from} = ${fmtMoney(r.rate, def, lang, { decimals: 4 })} (${r.as_of})`).join(' ; '));
  return { amount, currency: def, byCurrency: by, text: fmtMoney(amount, def, lang, { decimals: 2 }), note, converted: true };
}
const NOTE = {
  conv: { en: 'Converted at {list}.', fr: 'Converti au taux {list}.', ar: 'محوّل بسعر {list}.' },
  missing: { en: 'Amounts in several currencies without an exchange rate: subtotals per currency, not added.', fr: 'Montants en plusieurs devises sans taux de change : sous-totaux par devise, non additionnés.', ar: 'مبالغ بعدة عملات دون سعر صرف: مجاميع فرعية لكل عملة، غير مجمّعة.' },
};
