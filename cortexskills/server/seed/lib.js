// Seed helpers: translation memory (English source text → French / Arabic), triples and templating.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SEED_DIR = path.dirname(fileURLToPath(import.meta.url));
export const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(SEED_DIR, ...p), 'utf8'));
const tryJson = (...p) => { const f = path.join(SEED_DIR, ...p); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}; };

// Translation memory files: i18n/tm.<lang>.*.json, each {"English text": "translation"}.
const TM = { fr: {}, ar: {} };
const tmDir = path.join(SEED_DIR, 'i18n');
if (fs.existsSync(tmDir)) for (const f of fs.readdirSync(tmDir).filter(f => f.endsWith('.json'))) {
  const m = f.match(/^tm\.(fr|ar)\./); if (m) Object.assign(TM[m[1]], tryJson('i18n', f));
}
export const missing = { fr: new Set(), ar: new Set() };
// Composed translations for templated catalog sentences (role menus, task lists), built from TM entries.
const cap = x => x.charAt(0).toUpperCase() + x.slice(1);
const low = (x, l) => (l === 'fr' ? x.charAt(0).toLowerCase() + x.slice(1) : x);
const look = (l, x, deep = true) => { x = x.trim(); return TM[l][x] ?? TM[l][cap(x)] ?? TM[l][x.replace(/\.$/, '')] ?? (deep && !x.includes('; ') ? compose(l, x) : null) ?? null; };
const SEP = { fr: ' ; ', ar: '؛ ' };
function list(l, body) {
  const parts = body.replace(/\.$/, '').split('; ');
  const out = parts.map(x => look(l, x));
  return out.every(Boolean) ? out.map((x, i) => (i ? low(x, l) : x)).join(SEP[l]) : null;
}
function priceSeg(l, x) {
  let m;
  const n = v => (l === 'fr' ? v.replace('.', ',') : v);
  if ((m = x.match(/^(?:(Add-On) )?([A-Z]{2}-\d+): \$([\d.]+)\/month incl\. (\d+) (users|external users|concurrent engagements); \$([\d.]+)\/(user|external user|engagement) beyond$/))) {
    const U = { fr: { users: 'utilisateurs', 'external users': 'utilisateurs externes', 'concurrent engagements': 'missions simultanées', user: 'utilisateur', 'external user': 'utilisateur externe', engagement: 'mission' },
      ar: { users: 'مستخدم', 'external users': 'مستخدم خارجي', 'concurrent engagements': 'مهمة متزامنة', user: 'مستخدم', 'external user': 'مستخدم خارجي', engagement: 'مهمة' } }[l];
    return l === 'fr' ? `${m[2]} : ${n(m[3])} $/mois pour ${m[4]} ${U[m[5]]} inclus ; ${n(m[6])} $/${U[m[7]]} au-delà` : `${m[2]}: ${m[3]}$/شهر يشمل ${m[4]} ${U[m[5]]}؛ ${m[6]}$/${U[m[7]]} إضافي`;
  }
  if ((m = x.match(/^(?:Add-On )?([A-Z]{2}-\d+): \$([\d.]+)\/month on any Pack$/))) return l === 'fr' ? `${m[1]} : ${n(m[2])} $/mois sur toute offre` : `${m[1]}: ${m[2]}$/شهر مع أي باقة`;
  if ((m = x.match(/^included in (.+)$/))) return l === 'fr' ? `inclus dans ${m[1].replace(' and ', ' et ')}` : `مضمن في ${m[1].replace(' and ', ' و')}`;
  return null;
}
const PATTERNS = [
  [/^Subscription — (.+)$/, (l, m) => { const segs = m[1].split(' | ').map(x => priceSeg(l, x)); return segs.every(Boolean) && (l === 'fr' ? 'Abonnement — ' : 'اشتراك — ') + segs.join(' | '); }],
  [/^Add-On (AD-\d+) (.+)$/, (l, m) => { const a = look(l, m[2]); return a && (l === 'fr' ? `Module ${m[1]} ${a}` : `إضافة ${m[1]} ${a}`); }],
  [/^(.+?) workspace — (.+)$/, (l, m) => { const a = look(l, m[1]), b = look(l, m[2]); return a && b && (l === 'fr' ? `Espace de travail ${a} — ${b}` : `فضاء عمل ${a} — ${b}`); }],
  [/^Read-only access to (.+) records, dashboards and exports within scope\.$/, (l, m) => { const a = look(l, m[1]); return a && (l === 'fr' ? `Accès en lecture seule aux enregistrements, tableaux de bord et exports de ${a} dans le périmètre.` : `ولوج للقراءة فقط إلى سجلات ${a} ولوحاتها وتصديراتها ضمن النطاق.`); }],
  [/^Own the process: configure (.+?), approve and reopen with justification(?:; (.+))?\.$/, (l, m) => {
    const a = look(l, m[1]); if (!a) return null; const rest = m[2] ? list(l, m[2]) : '';
    if (rest === null) return null;
    const head = l === 'fr' ? `Piloter le processus : configurer ${a}, approuver et rouvrir avec justification` : `امتلاك المسار: إعداد ${a} والاعتماد وإعادة الفتح مع التبرير`;
    return head + (rest ? SEP[l] + low(rest, l) : '') + '.';
  }],
  [/^(.+; .+)$/, (l, m) => { const r = list(l, m[1]); return r && r + (m[1].endsWith('.') ? '.' : ''); }],
  [/^([^;]+)\.$/, (l, m) => { const r = TM[l][m[1]] ?? TM[l][cap(m[1])]; return r ? r.replace(/[.。]?$/, '.') : null; }],
];
function compose(l, s) { for (const [re, fn] of PATTERNS) { const m = s.match(re); if (m) { const r = fn(l, m); if (r) return r; } } return null; }
/** {en, fr, ar} for an English catalog string, using the translation memory (English fallback, reported). */
export function tr(en) {
  if (en == null) return { en: '', fr: '', ar: '' };
  const s = String(en).trim();
  const out = { en: s, fr: TM.fr[s] ?? compose('fr', s), ar: TM.ar[s] ?? compose('ar', s) };
  for (const l of ['fr', 'ar']) if (out[l] == null) { if (s && !/^[A-Z0-9 .;,\-–—/()%×→]+$/.test(s)) missing[l].add(s); out[l] = s; }
  return out;
}
/** A triple [en, fr, ar] from the content files → {en, fr, ar}. */
export const T = a => Array.isArray(a) ? { en: a[0], fr: a[1] ?? a[0], ar: a[2] ?? a[0] } : (a && typeof a === 'object' ? a : tr(a));
export const fillT = (t, vals) => Object.fromEntries(Object.entries(t).map(([l, s]) => [l, String(s).replace(/\{(\w+)\}/g, (m, k) => (vals[k] ? (typeof vals[k] === 'object' ? vals[k][l] : vals[k]) : m))]));
export const tmStats = () => ({ fr: Object.keys(TM.fr).length, ar: Object.keys(TM.ar).length });
