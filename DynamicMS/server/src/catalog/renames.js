// Renamed end-to-end processes (feedback "E2E process names", October 2026). The catalog is
// stored in the database, so installations seeded before the change are updated at start-up:
// the E2E names of the catalog and the titles of the documents that still carry an old name.
import { all, run, get, J, P, now, tx } from '../db.js';

export const E2E_RENAMES = {
  'E2E-05': { from: 'People To Capability', name: { en: 'Resources To Readiness', fr: 'Des ressources à la disponibilité opérationnelle', ar: 'من الموارد إلى الجاهزية' } },
  'E2E-06': { from: 'Infrastructure To Wellbeing', name: { en: 'Infrastructure To Security', fr: "De l'infrastructure à la sécurité", ar: 'من البنية التحتية إلى الأمن' } },
  'E2E-07': { from: 'Knowledge To Control', name: { en: 'Data To Intelligence', fr: "Des données à l'intelligence", ar: 'من البيانات إلى الذكاء' } },
  'E2E-09': { from: 'Verification To Preparedness', name: { en: 'Nonconformity To Knowledge', fr: 'De la non-conformité à la connaissance', ar: 'من عدم المطابقة إلى المعرفة' } },
  'E2E-11': { from: 'Audit To Assurance', name: { en: 'Intelligence To Assurance', fr: "De l'intelligence à l'assurance", ar: 'من الذكاء إلى الضمان' } },
  'E2E-12': { from: 'Correction To Innovation', name: { en: 'Improvement To Innovation', fr: "De l'amélioration à l'innovation", ar: 'من التحسين إلى الابتكار' } },
};

/** Returns the number of catalog entries and documents updated (0 when already up to date). */
export function applyE2eRenames() {
  const row = get("SELECT data FROM catalog_items WHERE kind='bundle' AND id='e2e'");
  if (!row) return 0;
  const e2e = P(row.data, []);
  const old = {}; // old name per language -> new name per language
  let changed = 0;
  for (const e of e2e) {
    const r = E2E_RENAMES[e.id];
    if (!r || e.name?.en !== r.from) continue;
    for (const l of ['en', 'fr', 'ar']) if (e.name[l]) old[e.name[l]] = r.name[l];
    e.name = { ...r.name };
    changed++;
  }
  if (!changed) return 0;
  tx(() => {
    run("UPDATE catalog_items SET data=?, version=version+1, updated_at=? WHERE kind='bundle' AND id='e2e'", J(e2e), now());
    for (const d of all('SELECT id, title FROM documents')) {
      const t = P(d.title);
      if (!t || typeof t !== 'object') continue;
      let hit = false;
      for (const l of Object.keys(t)) for (const [o, n] of Object.entries(old)) if (typeof t[l] === 'string' && t[l].includes(o)) { t[l] = t[l].split(o).join(n); hit = true; }
      if (hit) { run('UPDATE documents SET title=? WHERE id=?', J(t), d.id); changed++; }
    }
  });
  return changed;
}
