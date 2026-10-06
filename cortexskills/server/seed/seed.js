#!/usr/bin/env node
// Deterministic demonstration seed, reset by one command: npm run seed (FR-DA-OPS-07/09).
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 13)) { console.error(`CortexSkills needs Node.js 22.13 or newer (found ${process.versions.node}). Install the LTS version from https://nodejs.org and run "npm run seed" again.`); process.exit(1); }
const fs = await import('node:fs');
const path = await import('node:path');
const { config } = await import('../src/config.js');
for (const f of [config.dbFile, config.dbFile + '-wal', config.dbFile + '-shm']) if (fs.existsSync(f)) fs.rmSync(f);
fs.rmSync(config.attachmentDir, { recursive: true, force: true }); fs.mkdirSync(config.attachmentDir, { recursive: true });
const t0 = Date.now();
const { db, migrate, run, all, one, tx } = await import('../src/db.js');
const { S, detUuid: U, now } = await import('../src/lib/util.js');
migrate();
const { buildCatalog, insertCatalog } = await import('./catalog.js');
const { missing, tmStats, T, tr, readJson } = await import('./lib.js');
const cat = await import('../src/catalog.js');

console.log('• Building the reference catalog (process design, D01–D26, packs, verticals, SME)…');
const { K, fw } = buildCatalog();
K.trace = traceability(readJson('data', 'requirements.json'));
tx(() => insertCatalog(K));
cat.clearCatalogCache();

const { syncPermissions } = await import('../src/rbac.js');
const { insertRecord } = await import('../src/services/projects.js');
const { seedTemplateLibrary } = await import('./release11.js');
const { seedDocLibrary } = await import('./release110.js');
tx(() => {
  cat.list('role').forEach((r, i) => run(`INSERT INTO roles(id,name,baseline,sort) VALUES(?,?,?,?)`, r.id, S(r.name), null, i));
  syncPermissions();
  console.log('• Platform records: verticals, SME tracks, complexity criteria, gates, checklists, templates, packs…');
  const P = (entity, key, data) => insertRecord(U(key), entity, null, null, key.split(':').pop(), data, null, true);
  for (const v of cat.list('verticalSeed')) {
    P('Vertical', 'vertical:' + v.id, { prefix: v.prefix, name: v.name, description: T([`${v.name.en} vertical: sector processes, standards and checklists.`, `Verticale ${v.name.fr} : processus, normes et check-lists du secteur.`, `قطاع ${v.name.ar}: مسارات القطاع ومعاييره وقوائم التحقق.`]),
      parent: v.parent, parent_name: v.parentName, segments: T(['Large companies and SMEs', 'Grandes entreprises et PME', 'المقاولات الكبرى والصغرى والمتوسطة']), value_proposition: v.risk, standards: v.standards,
      macro_processes: v.mps.map(m => m.id), e2e_processes: v.e2e.map(e => e.id), lifecycle: 'Active', owner: 'Head of L&D', drivers: [{ code: 'drv-' + v.id, name: v.driver }], retention_years: 10, data_extensions: [{ object: 'SectorCertificate', attributes: ['standard', 'valid_until'] }] });
    P('ComplexityCriterion', 'crit:' + v.id, { code: 'drv-' + v.id, name: v.driver, weight: 100, vertical_id: v.id, levels: fw.levels.map(T) });
  }
  for (const t of cat.list('smeTrackSeed')) P('SmeTrack', 'track:' + t.id, { code: t.id, name: t.name, description: t.description, segment: t.segment, macro_processes: cat.list('smeMp').map(m => m.id), e2e_processes: cat.list('smeE2E').map(e => e.id), gates: t.gates.length, items_per_gate: t.items, duration_days: t.days, score_min: t.min, score_max: t.max, lifecycle: 'Active' });
  for (const c of fw.criteria) P('ComplexityCriterion', 'crit:' + c.code, { code: c.code, name: T(c.name), weight: c.weight, vertical_id: null, levels: fw.levels.map(T) });
  for (const c of cat.list('checklistSeedUniversal')) P('ChecklistTemplate', 'chk:' + c.id, { name: c.name, scope: 'Universal', vertical_id: null, mode: c.id === 'CL-SME' ? 'SME' : null, track: null, items: c.items, status: 'Published' });
  for (const g of cat.list('gateSeed')) P('GateDefinition', 'gatedef:' + g.id, { name: g.name, purpose: g.purpose, entry_criteria: g.entry, exit_criteria: g.exit, approvers: g.approvers, decisions: ['Go', 'No-Go', 'Hold', 'Recycle'],
    verticals: [], modes: ['Full', 'SME'], tracks: cat.list('smeTrackSeed').filter(t => t.gates.includes(g.id)).map(t => t.id), checklists: g.checklists.map((id, i) => ({ id: U('chk:' + id), code: id, mandatory: true, order: i + 1 })), enforce: true, status: 'Published' });
  const phasesOf = (mode, vertical) => cat.list('phase').map(p => ({ no: p.no, name: p.name, gate: p.gate, e2e: [...p.e2e, ...(vertical ? cat.get('verticalSeed', vertical).e2e.filter(e => e.phase === p.no).map(e => e.id) : []), ...(mode === 'SME' ? cat.list('smeE2E').filter(e => e.phase === p.no).map(e => e.id) : [])] }));
  for (const mode of ['Full', 'SME']) for (const focus of ['Digital', 'AI']) {
    const fl = cat.get('focusLabel', focus).label;
    P('ProjectTemplate', `tpl:universal:${mode}:${focus}`, { code: `PT-UNI-${mode === 'SME' ? 'SME' : 'FULL'}-${focus.toUpperCase()}`, name: { en: `Universal ${mode === 'SME' ? 'SME' : 'full'} run — ${fl.en} skills`, fr: `Déroulé ${mode === 'SME' ? 'PME' : 'complet'} universel — compétences ${fl.fr}`, ar: `مسار ${mode === 'SME' ? 'المقاولة' : 'كامل'} عام — كفاءات ${fl.ar}` },
      description: T(['All end-to-end processes, six phases and their gates.', 'Tous les processus de bout en bout, six phases et leurs jalons.', 'جميع المسارات وست مراحل ببواباتها.']), scope: 'Universal', vertical_id: null, mode, track: mode === 'SME' ? 'SME-T2' : null, focus, status: 'Published', phases: phasesOf(mode, null), roles: ['Head of L&D', 'L&D Analyst', 'HR Director'], milestones: ['G1', 'G3', 'G6'], use_count: 0, platform: true });
    for (const v of cat.list('verticalSeed')) P('ProjectTemplate', `tpl:${v.id}:${mode}:${focus}`, { code: `PT-${v.id}-${mode === 'SME' ? 'SME' : 'FULL'}-${focus.toUpperCase()}`, name: { en: `${v.name.en} — ${mode === 'SME' ? 'SME' : 'full'} run — ${fl.en}`, fr: `${v.name.fr} — déroulé ${mode === 'SME' ? 'PME' : 'complet'} — ${fl.fr}`, ar: `${v.name.ar} — مسار ${mode === 'SME' ? 'المقاولة' : 'كامل'} — ${fl.ar}` },
      description: v.risk, scope: 'Vertical', vertical_id: v.id, mode, track: mode === 'SME' ? 'SME-T2' : null, focus, status: 'Published', phases: phasesOf(mode, v.id), roles: ['Head of L&D', 'Compliance Officer'], milestones: ['G1', 'G3', 'G5', 'G6'], use_count: 1, platform: true });
  }
  P('ProjectTemplate', 'tpl:draft:example', { code: 'PT-UNI-DRAFT-LEAD', name: T(['Draft — Leadership academy', 'Brouillon — Académie du leadership', 'مسودة — أكاديمية القيادة']), scope: 'Universal', mode: 'Full', focus: 'All', status: 'Draft', phases: phasesOf('Full', null), use_count: 0, platform: true });
  seedTemplateLibrary();
  console.log(`• Document template library: ${seedDocLibrary()} templates`);
  for (const sp of cat.list('solutionPack')) P('Pack', 'pack:' + sp.id, { code: sp.id, name: sp.name, kind: sp.kind, price: sp.price, segment: sp.segment || '', contents: sp.packs, rules: { includedUsers: sp.includedUsers, overage: sp.overage, discount: sp.discount || 0, minUsers: sp.kind === 'sme' ? 5 : 1 } });
});

console.log('• Organizations, users, full runs (Digital and AI) for every vertical, Large and SME…');
const { seedPlatform, seedTenants, DEMO_PASSWORD } = await import('./tenants.js');
let orgs;
tx(() => { const h = seedPlatform(); orgs = seedTenants(h); });

// OnPrem mode: one signed licence file for every organization of this installation (D30 §7-8).
const { signLicence } = await import('../tools/sign-licence.js');
const lic = orgs.map(o => { const l = JSON.parse(one(`SELECT data FROM licences WHERE org_id=?`, o.id).data); return signLicence(l); });
fs.writeFileSync(config.licenceFile, JSON.stringify(lic, null, 2));

run(`INSERT OR REPLACE INTO meta(key,value) VALUES('seeded_at',?)`, now());
run(`INSERT OR REPLACE INTO meta(key,value) VALUES('version',?)`, JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version);
const { backupNow } = await import('../src/services/ops.js');
backupNow('seed');
const count = t => one(`SELECT COUNT(*) n FROM ${t}`).n;
const guide = { fr: [...missing.fr], ar: [...missing.ar] };
fs.writeFileSync(path.join(config.dataDir, 'missing-translations.json'), JSON.stringify(guide, null, 1));
console.log(`\n  Seed complete in ${Math.round((Date.now() - t0) / 1000)} s`);
console.log(`  ${count('organizations')} organizations in ${count('groups_')} groups · ${count('users')} users · ${count('projects')} projects (full runs)`);
console.log(`  ${count('e2e_instances')} end-to-end process instances · ${count('task_instances')} task instances · ${count('records')} records · ${count('kpi_values')} KPI values · ${count('alerts')} alerts`);
console.log(`  Translation memory: FR ${tmStats().fr}, AR ${tmStats().ar} entries · untranslated: FR ${guide.fr.length}, AR ${guide.ar.length}`);
console.log(`\n  Sign in at http://localhost:5173 with admin@cortexskills.app / Admin#2026, or any organization user with password ${DEMO_PASSWORD}.`);
console.log(`  Example: headld@${orgs[0].domain}  ·  headld@${orgs.find(o => o.seg === 'SME' && o.v.id === 'AEC').domain}\n`);
db.close();

function traceability(reqs) {
  // Implementation status of every requirement of the Dynamic Apps Standard SRS v1.6 (FR-DA-OPS-08).
  const PARTIAL = {
    'FR-DA-OPS-07': 'Two full runs per organization (Digital and AI) instead of ten instances of each E2E process; every E2E process is instantiated in every run.',
    'NFR-DA-SEC-14': 'SSO is registered as an external integration (INT-SSO-01); SAML/OIDC login and MFA need an identity provider at deployment.',
    'FR-DA-VDT-02': 'JSON, CSV, XML (BPMN) and PDF exchange provided; STEP/IGES/JT files are accepted as attachments, not parsed.',
    'FR-DA-VIN-01': 'REST and file-based connectors through the integration registry; SOAP/GraphQL connectors are configuration of the registry, not bundled.',
    'FR-DA-PKG-03': 'Upgrade and downgrade keep all data and show a prorated amount; invoicing is outside the application.',
    'FR-DA-PKG-04': 'Pack and bundle reports are produced from licence and quota data; revenue figures need the billing system.',
    'NFR-DA-MAINT-06': 'Guides are generated from source in Word and PDF with an automatic TOC; walkthrough replay is scripted in tools, run at release.',
    'NFR-DA-PORT-03': 'A CI workflow for Linux, Windows and macOS is provided in .github/workflows; it runs when the repository is hosted on GitHub.',
    'FR-DA-ONB-02': 'Spreadsheet/CSV import with validation and rejected-line reasons; legacy-system and cloud-storage import go through the integration registry.',
    'NFR-DA-UX-06': 'Brand-mandated white text on the primary orange and orange key figures are kept as the visual identity requires; body text uses grey tones that pass AA.',
  };
  const DEPLOY = ['NFR-DA-REL-02', 'NFR-DA-REL-04', 'NFR-DA-REL-06', 'NFR-DA-SEC-16', 'NFR-DA-PERF-08', 'NFR-DA-SCALE-01', 'NFR-DA-SCALE-03', 'NFR-DA-SCALE-04', 'NFR-DA-DATA-02', 'NFR-DA-UX-10', 'NFR-DA-PERF-06', 'NFR-DA-PERF-07'];
  const EVID = { TEN: 'Tenancy tree, groups, organizations, OBS routes (server/src/routes/tenancy.js)', RBAC: 'Permission matrix and requirePerm middleware (server/src/rbac.js)', CFG: 'Entitlements module and configuration screen (server/src/entitlements.js)',
    AI: 'AI Use Case library, activation, overrides and usage log (server/src/services/ai.js)', KB: 'Offline TF-IDF retrieval engine (server/src/services/retrieval.js)', GOV: 'Governance records, RACSI with unique Accountable index', BPMN: 'bpmn-js modeler with palette panel, full screen, import/export',
    REP: 'Report engine with PDF/Excel/Word exporters', ALT: 'Alert catalog and dedup index (server/src/services/alerts.js)', AST: 'Assistant intents with permission check before query', AUD: 'Append-only audit log and stage-then-justify', HLP: 'Help centre, search, legends and decision matrix',
    TPL: 'Versioned templates in the Project Template Catalog', I18N: 'Shared dictionary EN/FR/AR with RTL layout', WBS: 'Gantt computed from phases, processes and tasks', VER: 'Generic version service with compare and revert', COMM: 'Dispatch service with per-channel delivery status',
    REX: 'REX entries, prompt on closure, register view', NAV: 'Navigation model, dock, pin, favorites stored server-side', BMK: 'Benchmark engine with minimum sample and opt-out', OPS: 'Backups, migrations, guards, health endpoint, seed', PFO: 'Portfolio matrix with legend and CSV export',
    CHK: 'Checklist Library, standalone and gate-linked checklists', ATT: 'Attachments with accepted formats and limits', VRT: 'Vertical records with lifecycle, versions and activation', VPR: 'Vertical macro and E2E processes with tasks and steps', VDT: 'Data extensions and retention per vertical',
    VCP: 'Sector standards mapped to vertical checklists and controls', VIN: 'Integration registry', VCF: 'Vertical configuration validation before activation', SME: 'SME tracks, packs and mode', SCO: 'Weighted complexity scoring with vertical drivers', ONB: 'SME onboarding plan and import',
    PKG: 'Solution Pack variants: packs, bundles and SME packs with pricing rules', PTC: 'Project Template Catalog', PCM: 'Three creation modes on one entry point', GTE: 'Gate Library with decisions and waivers',
    PERF: 'Indexed SQLite queries; 30 s tenant cache', SEC: 'JWT, bcrypt, parameterized SQL, rate limit, security headers', REL: 'Deterministic AI fallback; structured export errors', SCALE: 'Stateless API and separate web tier', UX: 'Brand tokens, responsive layout, focus-visible states',
    PORT: 'node:sqlite, pure-JavaScript dependencies, npm install/seed/dev', MAINT: 'Single-source modules for entitlements, alerts, AI', COMPAT: 'Evergreen browsers; BPMN XML round trip', COMP: 'COSO coverage, AI log confidence, non-certification disclosure', DATA: 'No external call unless a user adds a model key' };
  return reqs.map(r => {
    const fam = r.id.split('-')[2];
    // Requirements added by SRS revisions 1.4 to 1.6 carry their own assessed status and evidence.
    if (r.v16) return { id: r.id, section: r.section, text: tr(r.text), status: r.v16.status, evidence: typeof r.v16.evidence === "object" ? r.v16.evidence : tr(r.v16.evidence) };
    const status = PARTIAL[r.id] ? 'Partial' : DEPLOY.includes(r.id) ? 'Deployment responsibility' : 'Met';
    return { id: r.id, section: r.section, text: tr(r.text), status, evidence: tr(PARTIAL[r.id] || (DEPLOY.includes(r.id) ? 'Target for the production hosting (sizing, uptime, encryption at rest, residency).' : EVID[fam] || 'Implemented')) };
  });
}
