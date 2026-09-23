// Field-by-field comparison of any two versions of a versioned record (FR-DA-VER-03).
import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { Card, CardHead, Select, Field, Badge } from './ui.jsx';

const flat = (obj, prefix = '') => Object.entries(obj || {}).reduce((acc, [k, v]) => {
  const key = prefix ? `${prefix}.${k}` : k;
  if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(acc, flat(v, key));
  else acc[key] = Array.isArray(v) ? v.join(', ') : v;
  return acc;
}, {});
const show = (v) => (v == null || v === '' ? '—' : String(v).length > 240 ? `${String(v).slice(0, 238)}…` : String(v));

export default function VersionCompare({ versions }) {
  const { t } = useI18n();
  const list = [...(versions || [])].sort((a, b) => b.version - a.version);
  const [a, setA] = useState(list[1]?.version ?? list[0]?.version);
  const [b, setB] = useState(list[0]?.version);
  const [onlyChanged, setOnlyChanged] = useState(true);
  if (list.length < 2) return <p className="small muted">{t('Comparison needs at least two versions.')}</p>;
  const va = flat(list.find((v) => v.version === Number(a))?.data); const vb = flat(list.find((v) => v.version === Number(b))?.data);
  const keys = [...new Set([...Object.keys(va), ...Object.keys(vb)])].filter((k) => !['id', 'org_id', 'created_at', 'updated_at'].includes(k)).sort();
  const rows = keys.map((k) => ({ k, x: va[k], y: vb[k], changed: show(va[k]) !== show(vb[k]) })).filter((r) => !onlyChanged || r.changed);
  const opts = list.map((v) => ({ value: v.version, label: `${t('Version')} ${v.version} · ${String(v.created_at).slice(0, 10)}${v.is_current ? ` · ${t('Current')}` : ''}` }));
  return (
    <Card className="quiet">
      <CardHead title={t('Compare two versions')} subtitle={t('Fields that differ are highlighted.')} />
      <div className="form-grid">
        <Field label={t('From')}><Select value={a} onChange={(e) => setA(Number(e.target.value))} options={opts} /></Field>
        <Field label={t('To')}><Select value={b} onChange={(e) => setB(Number(e.target.value))} options={opts} /></Field>
      </div>
      <label className="check" style={{ margin: '12px 0' }}><input type="checkbox" checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} />{t('Show changed fields only')}</label>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>{t('Field')}</th><th>{t('Version')} {a}</th><th>{t('Version')} {b}</th></tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r.k}><td className="strong">{r.k}{r.changed && <> <Badge tone="s2">{t('Changed')}</Badge></>}</td><td className="small">{show(r.x)}</td><td className="small">{show(r.y)}</td></tr>)}
            {!rows.length && <tr><td colSpan={3} className="muted">{t('No difference between these versions.')}</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
