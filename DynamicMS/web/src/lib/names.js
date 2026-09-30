// Names of the reference identifiers (phases E2E-xx, macro processes MP-xxx, functions F-xx),
// loaded once per language, so every screen can show "ID (name)" instead of a bare code.
import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useApp } from './state.jsx';

const cache = {};
const pending = {};
function load(lang) {
  pending[lang] ||= Promise.all([api('/catalog/e2e'), api('/catalog/mps'), api('/catalog/functions')]).then(([e2e, mps, fns]) => {
    const map = {};
    for (const e of e2e) map[e.id] = e.name;
    for (const m of mps) { map[m.id] = m.name; map[m.code] = m.name; }
    for (const f of fns.functions || []) map[f.id] = f.name;
    cache[lang] = map;
    return map;
  });
  return pending[lang];
}

// Returns a function: idName('E2E-01') -> "E2E-01 (Context To Strategy)".
export function useIdName() {
  const { lang } = useApp();
  const [map, setMap] = useState(cache[lang] || null);
  useEffect(() => { if (!cache[lang]) load(lang).then(setMap).catch(() => {}); else setMap(cache[lang]); }, [lang]);
  return (id, name) => {
    if (!id) return '';
    const n = name || map?.[id];
    const s = typeof n === 'object' && n ? n[lang] ?? n.en : n;
    return s ? `${id} (${s})` : String(id);
  };
}
