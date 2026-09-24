import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { post } from '../lib/api.js';
import { PageHeader, Card, CardHead, Field, Input, Textarea, Select, Button, useFetch, Skeleton, ErrorNote, useToast, Check as CheckBox, StatusBadge, Badge } from '../components/ui.jsx';
import { Radar } from '../components/charts.jsx';
import { SCORING_MATRIX, TRACK_THRESHOLDS } from '../lib/decisionMatrix.js';
import { Modal } from '../components/ui.jsx';

function ProjectNewForm() {
  const { me, switchOrg } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const toast = useToast();
  const tracks = useFetch('/reference/tracks');
  const people = useFetch('/directory');
  const obs = useFetch('/obs');
  const templates = useFetch('/templates');
  const mps = useFetch('/reference/macro-processes');
  const scope = useFetch(me.user.isPlatformAdmin ? '/portfolio/scope' : null);
  const orgOptions = scope.data?.orgs || [{ id: me.organization.id, name: me.organization.name, group_name: me.organization.group_name }];
  const [f, setF] = useState({ name: '', description: '', offer_type: 'Product', region: '', owner_id: me.user.id, sponsor_id: '', obs_node_id: '', template_id: '', planned_launch_date: '' });
  const [scores, setScores] = useState({});
  const [safety, setSafety] = useState(false);
  const [track, setTrack] = useState('');
  const [reason, setReason] = useState('');
  const [optional, setOptional] = useState([]);
  const [rec, setRec] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [matrix, setMatrix] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const criteria = tracks.data?.criteria || [];
  const complete = criteria.length && criteria.every((c) => scores[c.key] >= 1);

  useEffect(() => {
    if (!complete) { setRec(null); return; }
    post('/reference/recommend-track', { scores, safety_critical: safety }).then((r) => { setRec(r); setTrack((tr) => (r.allowed.includes(tr) ? tr : r.recommended)); }).catch(() => {});
  }, [scores, safety, complete]);

  const applyTemplate = (id) => {
    setF((x) => ({ ...x, template_id: id }));
    const tp = templates.data?.find((x) => String(x.id) === String(id))?.payload;
    if (tp) { if (tp.scores) setScores(tp.scores); if (tp.optional_mps) setOptional(tp.optional_mps); if (tp.offer_type) setF((x) => ({ ...x, offer_type: tp.offer_type, description: x.description || tp.description || '' })); }
  };
  const optionalList = useMemo(() => {
    if (!track || !tracks.data) return [];
    return tracks.data.matrix.filter((r) => r[`${track} Track`] === 'Optional' || r[`${track} Track`].startsWith('If '));
  }, [track, tracks.data]);

  if (!tracks.data || !people.data || !mps.data) return <div className="page"><Skeleton h={500} /></div>;
  const pm = people.data.filter((p) => p.roles.includes('R03'));
  const sponsors = people.data.filter((p) => p.roles.includes('R01'));
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const p = await post('/projects', { ...f, scores, safety_critical: safety, track, override_reason: track !== rec?.recommended ? reason : null, optional_mps: optional, owner_id: Number(f.owner_id) || undefined, sponsor_id: Number(f.sponsor_id) || undefined, obs_node_id: Number(f.obs_node_id) || undefined, template_id: Number(f.template_id) || undefined });
      toast.ok(t('Project {c} created. E2E-01 has started.', { c: p.code }));
      nav(`/projects/${p.id}`);
    } catch (e) { setError(e); } finally { setBusy(false); }
  };
  const canSubmit = f.name.trim() && complete && track && (track === rec?.recommended || reason.trim());
  const matrixModal = matrix && (
    <Modal wide title={t('Decision matrix: how to score a new project')} subtitle={t('Pick, for each criterion, the description closest to the project. The total decides the recommended track.')} onClose={() => setMatrix(false)}>
      <div className="table-wrap"><table className="data compact">
        <thead><tr><th>{t('Criterion')}</th>{[1, 2, 3, 4, 5].map((v) => <th key={v}>{t('Score {n}', { n: v })}</th>)}</tr></thead>
        <tbody>{SCORING_MATRIX.map((c) => <tr key={c.key}><td className="strong">{t(c.label)}</td>{c.levels.map((l, i) => <td key={i} className="small" style={scores[c.key] === i + 1 ? { background: 'var(--pa-orange-tint)' } : undefined}>{t(l)}</td>)}</tr>)}</tbody>
      </table></div>
      <h4 style={{ marginTop: 16 }}>{t('From total score to track')}</h4>
      <div className="table-wrap"><table className="data compact">
        <thead><tr><th>{t('Total score')}</th><th>{t('Recommended track')}</th><th>{t('Rule')}</th></tr></thead>
        <tbody>{TRACK_THRESHOLDS.map(([r, tr, rule]) => <tr key={r}><td>{r}</td><td>{t(tr)}</td><td className="small">{t(rule)}</td></tr>)}</tbody>
      </table></div>
    </Modal>
  );
  return (
    <div className="page">
      {matrixModal}
      <PageHeader eyebrow={t('UFS-28 Configure track & macro processes')} title={t('New innovation project')} subtitle={t('Describe the idea, score its complexity, confirm the track, then create it. E2E-01 Idea-to-Business Plan starts automatically.')} />
      <div className="grid two">
        <div className="stack">
          <Card>
            <CardHead title={t('Step 0. Where the project belongs')} subtitle={t('Every project belongs to one organization. The group, if any, comes from the organization.')} />
            <div className="form-grid">
              <Field label={t('Organization')} hint={me.user.isPlatformAdmin ? t('Changing it switches you to that organization: owners, teams and templates are loaded from there.') : t('Projects are created in your own organization.')}>
                <Select value={me.organization.id} disabled={!me.user.isPlatformAdmin} onChange={(e) => switchOrg(Number(e.target.value))} options={orgOptions.map((o) => ({ value: o.id, label: o.name }))} />
              </Field>
              <Field label={t('Belongs to a group?')}>
                <div className="row" style={{ minHeight: 40 }}><StatusBadge value={me.organization.group_name ? 'Yes' : 'No'} /><span>{me.organization.group_name || t('Independent organization')}</span></div>
              </Field>
            </div>
          </Card>
          <Card>
            <CardHead title={t('Step 1. Describe the project')} />
            <div className="form-grid">
              <Field label={t('Start from a template')} hint={t('Optional. A template pre-fills scores and optional macro processes.')} full>
                <Select value={f.template_id} onChange={(e) => applyTemplate(e.target.value)} placeholder={t('No template')} options={(templates.data || []).map((x) => ({ value: x.id, label: x.name }))} />
              </Field>
              <Field label={t('Project name')} required full><Input value={f.name} onChange={set('name')} /></Field>
              <Field label={t('Description')} full><Textarea value={f.description} onChange={set('description')} rows={3} /></Field>
              <Field label={t('Offer type')}><Select value={f.offer_type} onChange={set('offer_type')} options={['Product', 'Service', 'Product-Service'].map((v) => ({ value: v, label: t(v) }))} /></Field>
              <Field label={t('Region')}><Input value={f.region} onChange={set('region')} /></Field>
              <Field label={t('Product Manager (owner)')}><Select value={f.owner_id} onChange={set('owner_id')} options={pm.map((p) => ({ value: p.id, label: p.name }))} /></Field>
              <Field label={t('Executive Sponsor')}><Select value={f.sponsor_id} onChange={set('sponsor_id')} placeholder={t('Choose')} options={sponsors.map((p) => ({ value: p.id, label: p.name }))} /></Field>
              <Field label={t('Owning department (OBS)')}><Select value={f.obs_node_id} onChange={set('obs_node_id')} placeholder={t('Choose')} options={(obs.data || []).map((n) => ({ value: n.id, label: n.name }))} /></Field>
            </div>
          </Card>
          <Card>
            <CardHead title={t('Step 2. Score the complexity')} subtitle={t('Score each criterion from 1 (low) to 5 (high). Use 2 or 4 between the descriptions.')} actions={<Button size="sm" onClick={() => setMatrix(true)}>{t('Decision matrix')}</Button>} />
            <div className="stack">
              {criteria.map((c) => (
                <fieldset key={c.key} style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="strong small" style={{ marginBottom: 4 }}>{t(c.label)}</legend>
                  <div className="xs muted" style={{ marginBottom: 8 }}>1 = {t(c.low)} · 3 = {t(c.mid)} · 5 = {t(c.high)}</div>
                  <div className="segmented" role="radiogroup" aria-label={t(c.label)}>
                    {[1, 2, 3, 4, 5].map((v) => <button key={v} type="button" role="radio" aria-checked={scores[c.key] === v} onClick={() => setScores((s) => ({ ...s, [c.key]: v }))}>{v}</button>)}
                  </div>
                </fieldset>
              ))}
              <CheckBox label={t('Safety-critical product (Full Track is then mandatory)')} checked={safety} onChange={(e) => setSafety(e.target.checked)} />
            </div>
          </Card>
          {rec && (
            <Card>
              <CardHead title={t('Step 3. Confirm the track')} subtitle={t('Total score {n} of 35. Recommended: {r}.', { n: rec.total, r: t(`${rec.recommended} Track`) })} />
              {rec.reasons.map((r) => <div key={r} className="callout neutral" style={{ marginBottom: 8 }}>{t(r)}</div>)}
              <div className="row" role="radiogroup" aria-label={t('Track')}>
                {['Fast', 'Light', 'Full'].map((tr) => (
                  <Button key={tr} variant={track === tr ? 'primary' : 'secondary'} disabled={!rec.allowed.includes(tr)} aria-pressed={track === tr} icon={track === tr ? Check : undefined} onClick={() => setTrack(tr)}>
                    {t(`${tr} Track`)}{tr === rec.recommended ? ` · ${t('recommended')}` : ''}
                  </Button>
                ))}
              </div>
              {track && track !== rec.recommended && (
                <div style={{ marginTop: 16 }}><Field label={t('Justification for choosing another track')} required hint={t('Recorded as a track override (MP-123, task 12).')}><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field></div>
              )}
            </Card>
          )}
          {track && (
            <Card>
              <CardHead title={t('Step 4. Select optional macro processes')} subtitle={t('Mandatory processes are activated automatically. Select the optional ones this project needs.')} />
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                {optionalList.map((m) => (
                  <CheckBox key={m.MP} label={<span>{m.MP} {t(m['Macro process'])} {m[`${track} Track`].startsWith('If ') && <Badge>{t(m[`${track} Track`])}</Badge>}</span>}
                    checked={optional.includes(m.MP)} onChange={(e) => setOptional((o) => (e.target.checked ? [...o, m.MP] : o.filter((x) => x !== m.MP)))} />
                ))}
              </div>
            </Card>
          )}
          <ErrorNote error={error} />
          <div className="row end"><Button onClick={() => nav('/projects')}>{t('Cancel')}</Button><Button variant="primary" busy={busy} disabled={!canSubmit} onClick={submit}>{t('Create project')}</Button></div>
        </div>
        <div className="stack">
          <Card className="tint">
            <h3>{t('Complexity profile')}</h3>
            <Radar axes={criteria.map((c) => t(c.label).split(' ')[0])} values={criteria.map((c) => scores[c.key] || 0)} reference={criteria.map(() => 3)}
              primaryLabel={t('This project')} referenceLabel={t('Medium (3)')} caption={t('Scores per criterion against the medium reference line.')} />
          </Card>
          <Card>
            <h3>{t('Track rules')}</h3>
            <ul className="list-plain small">
              {tracks.data.thresholds.map((r) => <li key={r['Total score']}><strong className="strong">{r['Total score']}</strong> → {t(r['Recommended track'])}. {t(r['Override rules'])}</li>)}
            </ul>
            <table className="data" style={{ marginTop: 12 }}><thead><tr><th>{t('Track')}</th><th>{t('Gates')}</th><th>{t('Checklist items')}</th></tr></thead>
              <tbody>{tracks.data.tracks.map((r) => <tr key={r.Track}><td>{t(r.Track)}</td><td>{r.Gates}</td><td>{r['Checklist items per gate']}</td></tr>)}</tbody></table>
            {track && <p style={{ marginTop: 12 }}><StatusBadge value="Selected">{t(`${track} Track`)}</StatusBadge></p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Remount the form when the organization changes, so every list (owners, OBS, templates) reloads for it.
export default function ProjectNew() {
  const { me } = useAuth();
  return <ProjectNewForm key={me.organization.id} />;
}
