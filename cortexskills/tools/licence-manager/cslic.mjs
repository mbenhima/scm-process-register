#!/usr/bin/env node
// CortexSkills — gestionnaire de licences de l'éditeur (poste de signature, jamais sur un serveur client ni sur le VPS).
// Clés Ed25519, registre des licences et fichiers .lic dans CSLIC_HOME (par défaut ~/.cortexskills-editeur).
// CRUD : creer · lister / afficher · modifier / renouveler · revoquer / supprimer ; plus init, verifier, cle-publique.
// Aucune dépendance : Node.js 22 (node:crypto). Lancer « cslic aide ».
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HOME = path.resolve(process.env.CSLIC_HOME || path.join(os.homedir(), '.cortexskills-editeur'));
const KEYS = path.join(HOME, 'cles'), PRIV = path.join(KEYS, 'vendor-private.pem'), PUB = path.join(KEYS, 'vendor-public.pem');
const REG = path.join(HOME, 'registre.json'), LICS = path.join(HOME, 'licences'), ARCH = path.join(HOME, 'archives'), LOG = path.join(HOME, 'journal.log');
const PLANS = ['PK-01', 'PK-02', 'PK-03', 'PK-04', 'PK-05', 'PK-06', 'PK-07', 'PK-08', 'BND-01', 'BND-02', 'BND-03', 'BND-04', 'BND-05', 'SME-ESS', 'SME-GRO', 'SME-CMP'];
const ADDONS = Array.from({ length: 11 }, (_, i) => `AD-${String(i + 1).padStart(2, '0')}`);
// Paths shown to the user: the real folder of the workstation, also when cslic runs in a container.
const SHOWN = process.env.CSLIC_HOME_DISPLAY || HOME; const disp = p => String(p).replace(HOME, SHOWN);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const [cmd = 'aide', ...rest] = process.argv.slice(2);
const pos = []; const a = {};
for (let i = 0; i < rest.length; i++) { if (rest[i].startsWith('--')) { const k = rest[i].slice(2); const v = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true; a[k] = v; } else pos.push(rest[i]); }
const fail = m => { console.error(`\n  ERREUR : ${m}\n`); process.exit(1); };
const ok = m => console.log(`\n  ${m}\n`);
const today = () => new Date().toISOString().slice(0, 10);
const log = (action, id, detail = '') => fs.appendFileSync(LOG, `${new Date().toISOString()}\t${os.userInfo().username}\t${action}\t${id}\t${detail}\n`);
const ready = () => { if (!fs.existsSync(PRIV) || !fs.existsSync(REG)) fail(`Poste de signature non initialisé (${disp(HOME)}). Lancez d'abord : cslic init`); };
const load = () => JSON.parse(fs.readFileSync(REG, 'utf8'));
const save = r => { const tmp = REG + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(r, null, 2), { mode: 0o600 }); fs.renameSync(tmp, REG); };
const fingerprint = pem => crypto.createHash('sha256').update(crypto.createPublicKey(pem).export({ type: 'spki', format: 'der' })).digest('hex').match(/.{2}/g).join(':');
const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
const daysLeft = d => Math.ceil((new Date(d) - Date.now()) / 86400000);
const state = l => (l.statut === 'revoquee' ? 'RÉVOQUÉE' : l.statut === 'remplacee' ? 'REMPLACÉE' : daysLeft(l.fin) < 0 ? 'EXPIRÉE' : daysLeft(l.fin) <= 30 ? `ACTIVE (${daysLeft(l.fin)} j)` : 'ACTIVE');
const find = (r, id) => r.licences.find(l => l.id === String(id || '').toUpperCase()) || fail(`Licence inconnue : ${id}. Voir : cslic lister --tout`);
const list = v => String(v || '').split(/[,;\s]+/).map(x => x.trim().toUpperCase()).filter(Boolean);

function checkTerms({ plan, utilisateurs: users, fin, addons }) {
  if (!PLANS.includes(plan)) fail(`Plan inconnu ${plan}. Plans : ${PLANS.join(', ')}`);
  if (!(Number.isInteger(users) && users > 0 && users <= 100000)) fail('--utilisateurs doit être un nombre entier positif.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fin) || Number.isNaN(Date.parse(fin))) fail('--fin doit être une date AAAA-MM-JJ.');
  if (fin <= today()) fail('--fin doit être dans le futur.');
  const bad = addons.filter(x => !ADDONS.includes(x)); if (bad.length) fail(`Add-on inconnu : ${bad.join(', ')}. Add-ons : ${ADDONS.join(', ')}`);
}
/** Signe une licence au format lu par CortexSkills et écrit le fichier .lic. */
function issue(e) {
  const payload = { version: e.version, licenceId: e.id, companyId: e.orgId, companyName: e.societe, expiryDate: new Date(e.fin + 'T23:59:59Z').toISOString(),
    maxUsers: e.utilisateurs, plan: e.plan, addons: e.addons, features: e.fonctions, issueDate: new Date().toISOString(), customerRef: e.ref || null };
  const signature = crypto.sign(null, Buffer.from(JSON.stringify(payload)), fs.readFileSync(PRIV, 'utf8')).toString('base64');
  const file = path.join(LICS, `${e.id}_v${e.version}_${slug(e.societe)}.lic`);
  fs.writeFileSync(file, JSON.stringify({ ...payload, signature }, null, 2), { mode: 0o644 }); // readable: the container reads it as another user
  return path.relative(HOME, file);
}
function verifyFile(f) {
  let lic; try { lic = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { fail(`${f} n'est pas un fichier de licence (JSON invalide).`); }
  const { signature, ...payload } = Array.isArray(lic) ? lic[0] : lic;
  const valid = !!signature && crypto.verify(null, Buffer.from(JSON.stringify(payload)), fs.readFileSync(PUB, 'utf8'), Buffer.from(signature, 'base64'));
  return { valid, payload };
}
const show = l => console.log(`
  ${l.id} · version ${l.version} · ${state(l)}
  Société          ${l.societe}${l.ref ? `  (réf. ${l.ref})` : ''}
  Organization ID  ${l.orgId}
  Plan             ${l.plan}
  Utilisateurs     ${l.utilisateurs}
  Add-ons          ${l.addons.join(', ') || 'aucun'}
  Fin              ${l.fin}${l.statut === 'active' ? `  (${daysLeft(l.fin)} jours)` : ''}
  Émise le         ${l.emise}${l.notes ? `\n  Notes            ${l.notes}` : ''}${l.motif ? `\n  Motif            ${l.motif}` : ''}
  Fichier          ${disp(path.join(HOME, l.fichier))}
  Historique       ${l.historique.map(h => `${h.date} ${h.action}${h.detail ? ' (' + h.detail + ')' : ''}`).join(' · ')}
`);

switch (cmd) {
  case 'init': {
    if (fs.existsSync(PRIV)) fail(`Une paire de clés existe déjà dans ${disp(KEYS)}. Ne la recréez jamais : toutes les licences émises en dépendent.`);
    fs.mkdirSync(KEYS, { recursive: true, mode: 0o700 }); fs.mkdirSync(LICS, { recursive: true, mode: 0o700 }); fs.mkdirSync(ARCH, { recursive: true, mode: 0o700 });
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(PRIV, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    fs.writeFileSync(PUB, publicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o644 });
    if (!fs.existsSync(REG)) save({ creeLe: new Date().toISOString(), compteur: 0, licences: [] });
    log('init', '-', fingerprint(fs.readFileSync(PUB, 'utf8')));
    ok(`Poste de signature prêt : ${disp(HOME)}\n  Clé publique : ${disp(PUB)}\n  Empreinte    : ${fingerprint(fs.readFileSync(PUB, 'utf8'))}\n\n  SAUVEGARDEZ MAINTENANT ${disp(PRIV)} hors ligne et chiffrée (cslic sauvegarder).`);
    break;
  }
  case 'creer': case 'create': {
    ready(); const r = load();
    const e = { societe: a.societe, orgId: String(a['org-id'] || ''), plan: String(a.plan || '').toUpperCase(), utilisateurs: Number(a.utilisateurs), fin: String(a.fin || ''), addons: list(a.addons), fonctions: String(a.fonctions || '').split(',').map(x => x.trim()).filter(Boolean), ref: a.ref || null, notes: a.notes || null };
    if (!e.societe || e.societe === true) fail('--societe est obligatoire.');
    if (!UUID.test(e.orgId)) fail('--org-id doit être l\'Organization ID affiché par « licence-request » chez le client (format UUID).');
    checkTerms(e);
    const dup = r.licences.find(l => l.orgId === e.orgId && l.statut === 'active'); if (dup) fail(`${dup.id} est déjà active pour cette organisation. Utilisez : cslic modifier ${dup.id} ...`);
    r.compteur += 1; Object.assign(e, { id: `L-${String(r.compteur).padStart(4, '0')}`, version: 1, statut: 'active', emise: today(), historique: [{ date: today(), action: 'création', detail: `${e.plan}, ${e.utilisateurs} utilisateurs, fin ${e.fin}` }] });
    e.fichier = issue(e); r.licences.push(e); save(r); log('creer', e.id, `${e.societe} ${e.plan} ${e.utilisateurs} ${e.fin}`);
    ok(`Licence ${e.id} créée pour ${e.societe}.\n  Fichier à envoyer : ${disp(path.join(HOME, e.fichier))}`);
    break;
  }
  case 'lister': case 'list': {
    ready(); const r = load(); const rows = r.licences.filter(l => a.tout || l.statut === 'active');
    if (!rows.length) { ok(a.tout ? 'Registre vide.' : 'Aucune licence active (cslic lister --tout pour l\'historique).'); break; }
    console.log(`\n  ${'ID'.padEnd(7)} ${'Société'.padEnd(26)} ${'Plan'.padEnd(8)} ${'Util.'.padEnd(6)} ${'Fin'.padEnd(10)} ${'V'.padEnd(2)} État`);
    for (const l of rows) console.log(`  ${l.id.padEnd(7)} ${l.societe.slice(0, 26).padEnd(26)} ${l.plan.padEnd(8)} ${String(l.utilisateurs).padEnd(6)} ${l.fin} ${String(l.version).padEnd(2)} ${state(l)}`);
    if (a.csv) { const f = typeof a.csv === 'string' ? a.csv : 'registre-licences.csv'; fs.writeFileSync(f, 'id;societe;organization_id;plan;utilisateurs;addons;fin;version;etat;emise;reference\n' + rows.map(l => [l.id, l.societe, l.orgId, l.plan, l.utilisateurs, l.addons.join(','), l.fin, l.version, state(l), l.emise, l.ref || ''].join(';')).join('\n') + '\n'); console.log(`\n  Export : ${f}`); }
    console.log('');
    break;
  }
  case 'afficher': case 'show': { ready(); show(find(load(), pos[0])); break; }
  case 'modifier': case 'renouveler': case 'update': case 'renew': {
    ready(); const r = load(); const l = find(r, pos[0]);
    if (l.statut !== 'active') fail(`${l.id} est ${state(l).toLowerCase()} : on ne peut modifier qu'une licence active. Créez-en une nouvelle si besoin.`);
    const before = `${l.plan}, ${l.utilisateurs} utilisateurs, fin ${l.fin}, add-ons ${l.addons.join(',') || 'aucun'}`;
    const n = { ...l, plan: a.plan ? String(a.plan).toUpperCase() : l.plan, utilisateurs: a.utilisateurs ? Number(a.utilisateurs) : l.utilisateurs, fin: a.fin ? String(a.fin) : l.fin, addons: a.addons !== undefined ? list(a.addons === true ? '' : a.addons) : l.addons, notes: a.notes || l.notes };
    if ((cmd === 'renouveler' || cmd === 'renew') && !a.fin) fail('renouveler demande --fin AAAA-MM-JJ.');
    checkTerms(n);
    n.version = l.version + 1; n.emise = today(); n.fichier = issue(n);
    const after = `${n.plan}, ${n.utilisateurs} utilisateurs, fin ${n.fin}, add-ons ${n.addons.join(',') || 'aucun'}`;
    n.historique = [...l.historique, { date: today(), action: cmd === 'renouveler' || cmd === 'renew' ? 'renouvellement' : 'modification', detail: `${before} → ${after}` }];
    r.licences[r.licences.indexOf(l)] = n; save(r); log('modifier', l.id, `v${n.version} ${after}`);
    ok(`${l.id} version ${n.version} signée (${after}).\n  Fichier à envoyer : ${disp(path.join(HOME, n.fichier))}\n  Le client l'installe comme la première fois (licence-install) : elle remplace l'ancienne.`);
    break;
  }
  case 'revoquer': case 'revoke': {
    ready(); const r = load(); const l = find(r, pos[0]);
    if (l.statut === 'revoquee') fail(`${l.id} est déjà révoquée.`);
    l.statut = 'revoquee'; l.motif = a.motif && a.motif !== true ? a.motif : 'non précisé'; l.historique.push({ date: today(), action: 'révocation', detail: l.motif }); save(r); log('revoquer', l.id, l.motif);
    ok(`${l.id} révoquée dans le registre (motif : ${l.motif}).\n  Sur une installation que vous administrez : cortexskills-admin licence-remove --org <domaine> --yes\n  Chez un client : la licence cesse à sa date de fin (${l.fin}) ; ne la renouvelez pas et appliquez le contrat.`);
    break;
  }
  case 'supprimer': case 'delete': {
    ready(); const r = load(); const l = find(r, pos[0]);
    if (l.statut === 'active' && daysLeft(l.fin) >= 0 && !a.force) fail(`${l.id} est active. Révoquez-la d'abord (cslic revoquer ${l.id}), ou ajoutez --force.`);
    if (!a.oui) fail(`Supprimer ${l.id} (${l.societe}) du registre ? Ajoutez --oui pour confirmer. Le fichier .lic est déplacé dans ${disp(ARCH)}.`);
    for (const f of fs.readdirSync(LICS).filter(f => f.startsWith(l.id + '_'))) fs.renameSync(path.join(LICS, f), path.join(ARCH, f)); // every version
    fs.writeFileSync(path.join(ARCH, `${l.id}.json`), JSON.stringify(l, null, 2), { mode: 0o600 });
    r.licences = r.licences.filter(x => x !== l); save(r); log('supprimer', l.id, l.societe);
    ok(`${l.id} supprimée du registre ; fiche et fichiers (toutes versions) archivés dans ${disp(ARCH)}.`);
    break;
  }
  case 'verifier': case 'verify': {
    ready(); const f = pos[0]; if (!f || !fs.existsSync(f)) fail('Usage : cslic verifier <fichier.lic>');
    const { valid, payload } = verifyFile(f);
    ok(`${valid ? 'SIGNATURE VALIDE' : 'SIGNATURE INVALIDE (fichier modifié ou signé par une autre clé)'}\n  ${payload.companyName} · ${payload.companyId}\n  Plan ${payload.plan} · ${payload.maxUsers} utilisateurs · fin ${String(payload.expiryDate).slice(0, 10)} · add-ons ${(payload.addons || []).join(', ') || 'aucun'}`);
    if (!valid) process.exit(2);
    break;
  }
  case 'cle-publique': case 'public-key': {
    ready(); const to = pos[0] || '.'; const dst = fs.existsSync(to) && fs.statSync(to).isDirectory() ? path.join(to, 'vendor-public.pem') : to;
    fs.copyFileSync(PUB, dst); ok(`Clé publique copiée : ${dst}\n  Empreinte : ${fingerprint(fs.readFileSync(PUB, 'utf8'))}`);
    break;
  }
  case 'empreinte': case 'fingerprint': { ready(); ok(`Empreinte de la clé publique : ${fingerprint(fs.readFileSync(PUB, 'utf8'))}`); break; }
  default:
    console.log(`
  cslic — licences CortexSkills (poste de signature : ${disp(HOME)})

  cslic init                                         crée la paire de clés et le registre (une seule fois)
  cslic creer --societe "Clinique Exemple" --org-id <Organization ID> --plan SME-GRO --utilisateurs 50 --fin 2027-12-31
              [--addons AD-02,AD-11] [--fonctions analytics,export] [--ref CONTRAT-2026-014] [--notes "..."]
  cslic lister [--tout] [--csv registre.csv]        licences actives (ou toutes), export CSV
  cslic afficher L-0001                              détail et historique d'une licence
  cslic modifier L-0001 [--plan] [--utilisateurs] [--fin] [--addons]   nouvelle version signée
  cslic renouveler L-0001 --fin 2028-12-31           nouvelle version avec une nouvelle date de fin
  cslic revoquer L-0001 --motif "contrat résilié"    marque la licence révoquée
  cslic supprimer L-0001 --oui [--force]             retire du registre (archive la fiche et le fichier)
  cslic verifier fichier.lic                         contrôle la signature d'un fichier
  cslic cle-publique [dossier]                       copie vendor-public.pem (pour les paquets clients)
  cslic empreinte                                    empreinte SHA-256 de la clé publique
  cslic-paquet <paquet-client.zip> [dossier]         ajoute la clé publique au paquet client et calcule son empreinte
  cslic-sauvegarder [dossier]                        archive chiffrée du poste de signature
`);
}
