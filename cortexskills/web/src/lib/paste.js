// Structured paste and copy of records (SRS 1.8 FR-DA-MRE-19 – 23, NFR-DA-SEC-21).
// The clipboard is read as an HTML table, tab-separated text, or comma- or semicolon-separated text. Pasted content
// is untrusted: an HTML table is parsed with DOMParser in an inert document (no script runs, no image loads) and only
// the text of its cells is kept; line breaks are kept, formatting is removed. Values are converted in the user's
// locale and checked like typed values; the server checks them again.

const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const clean = s => String(s ?? '').replace(/\r\n?/g, '\n').replace(CTRL, '').replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').trim();

/** Text of an HTML cell: <br> and block ends become line breaks; nothing else is kept. */
function cellText(td) {
  const c = td.cloneNode(true);
  c.querySelectorAll('script, style, img, svg, object, iframe').forEach(n => n.remove());
  c.querySelectorAll('br').forEach(n => n.replaceWith('\n'));
  c.querySelectorAll('p, div, li').forEach(n => { n.append('\n'); });
  return clean(c.textContent).replace(/\n{3,}/g, '\n\n');
}
function fromHtml(html) {
  if (!/<table[\s>]/i.test(html)) return null;
  const doc = new DOMParser().parseFromString(html, 'text/html'); const table = doc.querySelector('table'); if (!table) return null;
  const rows = [];
  for (const tr of table.querySelectorAll('tr')) {
    const cells = []; for (const td of tr.children) { if (!/^(TD|TH)$/.test(td.tagName)) continue; const span = Math.min(50, Number(td.getAttribute('colspan')) || 1); cells.push(cellText(td)); for (let i = 1; i < span; i++) cells.push(''); }
    if (cells.some(x => x !== '')) rows.push(cells);
  }
  return rows.length ? rows : null;
}
/** Delimited text with quoted fields ("a ""b""", line breaks inside quotes). */
export function parseDelimited(text, sep) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; continue; }
    if (ch === '"' && cur.trim() === '') { q = true; cur = ''; continue; }
    if (ch === sep) { row.push(cur); cur = ''; continue; }
    if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; continue; }
    if (ch === '\r') continue;
    cur += ch;
  }
  row.push(cur); rows.push(row);
  return rows.map(r => r.map(clean)).filter(r => r.some(x => x !== ''));
}
function detectSep(text) {
  const lines = text.split('\n').slice(0, 20).filter(Boolean); if (!lines.length) return null;
  if (lines.some(l => l.includes('\t'))) return '\t';
  const score = s => { const n = lines.map(l => l.split(s).length - 1); return n.every(x => x === n[0]) && n[0] > 0 ? n[0] + 100 : Math.min(...n); };
  const sc = score(';'), cc = score(',');
  if (sc <= 0 && cc <= 0) return null;
  return sc >= cc ? ';' : ',';
}

/** { format, rows } from a paste event's clipboard, or null when it holds a single value (normal typing paste). */
export function readClipboard(dt) {
  const html = dt?.getData?.('text/html') || ''; const text = (dt?.getData?.('text/plain') || '').replace(/\r\n?/g, '\n');
  const h = html && fromHtml(html);
  if (h && (h.length > 1 || h[0].length > 1)) return { format: 'html', rows: h };
  const body = text.replace(/\n+$/, '');
  if (!body) return null;
  const sep = detectSep(body);
  if (!sep) { const lines = body.split('\n').map(clean).filter(Boolean); return lines.length > 1 ? { format: 'text', rows: lines.map(l => [l]) } : null; }
  const rows = parseDelimited(body, sep); if (!rows.length || (rows.length === 1 && rows[0].length === 1)) return null;
  return { format: sep === '\t' ? 'tsv' : sep === ';' ? 'ssv' : 'csv', rows };
}

const colNames = c => [c.key, c.label, ...(c.aliases || [])].map(norm).filter(Boolean);
/** True when most cells of the first row name a column of the table. */
export function looksLikeHeader(first, columns, rest = []) {
  const filled = first.filter(x => x !== ''); if (!filled.length) return false;
  const hit = filled.filter(x => columns.some(c => colNames(c).includes(norm(x)))).length;
  if (hit >= Math.max(1, Math.ceil(filled.length / 2))) return true;
  // A title over a column of numbers or dates (e.g. "Budget" over "1 000") also marks a header row.
  const typed = v => /^[-+]?[\d\s.,]+%?$/.test(String(v).trim()) || /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(String(v).trim());
  return hit >= 1 && first.some((h, i) => { if (!h || typed(h)) return false; const vals = rest.slice(0, 20).map(r => r[i]).filter(Boolean); return vals.length > 0 && vals.filter(typed).length * 2 >= vals.length; });
}
/**
 * Mapping source column → target column key (null = ignored): by header, then by position from the start column,
 * or the mapping the user confirmed last time for this Multi-Entry when it fits.
 */
export function proposeMapping({ rows, header, columns, startKey, saved }) {
  const width = Math.max(...rows.map(r => r.length));
  const editable = columns.filter(c => !c.readOnly && !c.computed);
  if (saved && saved.length === width && saved.every(k => k == null || editable.some(c => c.key === k))) return { mapping: saved, remembered: true };
  const mapping = Array(width).fill(null); const used = new Set();
  if (header) rows[0].forEach((h, i) => { const c = editable.find(x => !used.has(x.key) && colNames(x).includes(norm(h))); if (c) { mapping[i] = c.key; used.add(c.key); } });
  let p = Math.max(0, editable.findIndex(c => c.key === startKey));
  for (let i = 0; i < width; i++) {
    if (mapping[i]) continue;
    if (header && mapping.some(Boolean) && rows[0][i]?.trim()) continue; // a titled column that matches nothing is ignored
    while (p < editable.length && used.has(editable[p].key)) p++;
    if (p < editable.length) { mapping[i] = editable[p].key; used.add(editable[p].key); p++; }
  }
  return { mapping, remembered: false };
}

/** Number in the user's locale: "1 234,5" (fr, ar), "1,234.5" (en); a lone separator is read as decimal. */
export function parseNumber(raw, lang) {
  let s = String(raw ?? '').trim().replace(/[\s  ']/g, '').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/(\d)\s*(?:[A-Z]{3}|[€$£%])$/, '$1').replace(/^(?:[A-Z]{3}|[€$£])\s*(?=[-+]?\d)/, '');
  if (s === '') return '';
  const comma = s.lastIndexOf(','), dot = s.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) s = comma > dot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (comma >= 0) s = lang === 'en' && /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(/,/g, '.');
  else if (dot >= 0 && lang !== 'en' && /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return Number.isNaN(Number(s)) ? String(raw).trim() : String(Number(s));
}
/** Date in the user's locale to ISO: dd/mm/yyyy (fr, ar), mm/dd/yyyy (en), yyyy-mm-dd, dd.mm.yyyy, Excel serials. */
export function parseDate(raw, lang) {
  const s = String(raw ?? '').trim(); if (!s) return '';
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/); if (m) return iso(m[1], m[2], m[3], s);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) { let [, a, b, y] = m; if (y.length === 2) y = '20' + y; const [d, mo] = lang === 'en' && !s.includes('.') ? [b, a] : [a, b]; return iso(y, mo, d, s); }
  if (/^\d{5}$/.test(s)) { const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400000); return d.toISOString().slice(0, 10); }
  const d = new Date(s); return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}
const iso = (y, m, d, raw) => { const v = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; const dt = new Date(v + 'T00:00:00Z'); return Number.isNaN(dt.getTime()) || dt.getUTCDate() !== Number(d) ? raw : v; };

/**
 * One pasted cell converted for its column: numbers and dates in the locale; a controlled-list value matched on
 * its value or label ignoring case and accents, or an "ID (name)" reference; otherwise a Custom value when the
 * column allows one (marked `custom`), else kept as typed so the cell shows it as invalid.
 */
export function convertCell(col, raw, lang) {
  const v = clean(raw);
  if (col.type === 'number') return { value: parseNumber(v, lang) };
  if (col.type === 'date') return { value: parseDate(v, lang) };
  if (col.type === 'boolean') { const n = norm(v); return { value: ['1', 'true', 'yes', 'oui', 'vrai', 'x', 'نعم'].includes(n) ? true : ['0', 'false', 'no', 'non', 'faux', 'لا', ''].includes(n) ? false : v }; }
  if (col.type === 'select' && col.options && v !== '') {
    const opts = col.options.map(o => ({ value: String(o.value ?? o), label: String(o.label ?? o) }));
    const n = norm(v); let hit = opts.find(o => norm(o.value) === n || norm(o.label) === n);
    if (!hit) { const ref = v.match(/^\s*([^()]+?)\s*\((.+)\)\s*$/); if (ref) hit = opts.find(o => norm(o.value) === norm(ref[1]) || norm(o.label) === n || norm(o.label).startsWith(norm(ref[1]) + ' (')); }
    if (!hit) hit = opts.find(o => norm(o.label).split(' (')[0] === n || (norm(o.label).match(/\((.+)\)$/) || [])[1] === n);
    if (hit) return { value: hit.value };
    return { value: v, custom: !!col.custom };
  }
  return { value: v };
}

/** Rows of values ready to save, from the clipboard rows and the mapping. */
export function buildRows({ rows, header, mapping, columns, lang }) {
  const byKey = Object.fromEntries(columns.map(c => [c.key, c]));
  return (header ? rows.slice(1) : rows).map(r => { const data = {}; const custom = {}; mapping.forEach((k, i) => { if (!k || !byKey[k]) return; const out = convertCell(byKey[k], r[i] ?? '', lang); data[k] = out.value; if (out.custom) custom[k] = true; }); return { data, custom }; });
}

/** Text that a spreadsheet would run as a formula is neutralized on export (NFR-DA-SEC-21). */
export const neutralize = v => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) && !/^[-+]?\d[\d\s.,]*$/.test(v) ? "'" + v : v);

/** Copy out: the selected rows with their column titles, as TSV and as an HTML table (FR-DA-MRE-23). */
export function toClipboard(columns, rows) {
  const tsvCell = v => { const s = String(v ?? ''); return /[\t\n"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  const tsv = [columns.map(c => tsvCell(c.label)).join('\t'), ...rows.map(r => columns.map(c => tsvCell(r[c.key])).join('\t'))].join('\n');
  const html = `<table><thead><tr>${columns.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${columns.map(c => `<td>${esc(r[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return { tsv, html };
}
export async function writeClipboard({ tsv, html }, event) {
  if (event?.clipboardData) { event.clipboardData.setData('text/plain', tsv); event.clipboardData.setData('text/html', html); event.preventDefault(); return true; }
  try {
    if (window.ClipboardItem && navigator.clipboard?.write) { await navigator.clipboard.write([new window.ClipboardItem({ 'text/plain': new Blob([tsv], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]); return true; }
    await navigator.clipboard.writeText(tsv); return true;
  } catch { return false; }
}
