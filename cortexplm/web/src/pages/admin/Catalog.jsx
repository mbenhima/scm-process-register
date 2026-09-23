import { useMemo, useState } from 'react';
import { useI18n } from '../../lib/i18n.jsx';
import { PageHeader, Card, CardHead, DataTable, useFetch, Skeleton, Tabs, Badge, Field, Select, Input, Check, Kpi } from '../../components/ui.jsx';
import { BarChart } from '../../components/charts.jsx';

function Quote({ cat }) {
  const { t } = useI18n();
  const [sub, setSub] = useState('PACK-06');
  const [users, setUsers] = useState(25);
  const [addons, setAddons] = useState([]);
  const q = useMemo(() => {
    const p = cat.packs.find((x) => x.id === sub); const b = cat.bundles.find((x) => x.id === sub);
    const price = p ? p.price : b.price; const min = p ? p.minUsers : Math.max(...b.packs.map((id) => cat.packs.find((x) => x.id === id).minUsers));
    const billed = Math.max(Number(users) || 0, min);
    const n = billed; const disc = n > 1000 ? null : n > 500 ? 20 : n > 250 ? 15 : n > 100 ? 10 : n > 50 ? 5 : 0;
    const gross = price * billed;
    return { price, min, billed, disc, gross, net: disc == null ? null : Math.round(gross * (1 - disc / 100)) };
  }, [sub, users, cat]);
  return (
    <div className="grid two">
      <Card>
        <CardHead title={t('Build a quote')} subtitle={t('List prices per user per month, minimum users and volume discounts from the catalog.')} />
        <div className="form-grid">
          <Field label={t('Pack or bundle')} full><Select value={sub} onChange={(e) => setSub(e.target.value)} options={[...cat.packs.map((p) => ({ value: p.id, label: `${p.id} ${p.name} · $${p.price}` })), ...cat.bundles.map((b) => ({ value: b.id, label: `${b.id} ${b.name} · $${b.price}` }))]} /></Field>
          <Field label={t('Number of users')}><Input type="number" min="1" value={users} onChange={(e) => setUsers(e.target.value)} /></Field>
        </div>
        <h4 style={{ marginTop: 16 }}>{t('Add-ons (price on request)')}</h4>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 4 }}>{cat.addons.map((a) => <Check key={a.id} label={`${a.id} ${t(a.name)}`} checked={addons.includes(a.id)} onChange={(e) => setAddons(e.target.checked ? [...addons, a.id] : addons.filter((x) => x !== a.id))} />)}</div>
      </Card>
      <div className="stack">
        <div className="grid kpis">
          <Kpi value={q.net == null ? t('Custom') : `$${q.net.toLocaleString('en-US')}`} label={t('Monthly price after discount')} meta={q.disc == null ? t('More than 1,000 users: custom pricing') : t('{d}% volume discount', { d: q.disc })} />
          <Kpi value={q.billed} label={t('Billed users')} meta={t('Minimum {m} users', { m: q.min })} neutral />
          <Kpi value={`$${q.price}`} label={t('Per user per month')} neutral />
        </div>
        {addons.length > 0 && <Card className="quiet"><p className="small" style={{ margin: 0 }}>{t('{n} add-ons selected: {a}. The catalog gives no list price; they are quoted separately.', { n: addons.length, a: addons.join(', ') })}</p></Card>}
      </div>
    </div>
  );
}

export default function Catalog() {
  const { t } = useI18n();
  const [tab, setTab] = useState('packs');
  const { data: cat } = useFetch('/catalog');
  if (!cat) return <div className="page"><Skeleton h={500} /></div>;
  return (
    <div className="page">
      <PageHeader eyebrow={t('Administration · Commercial packaging')} title={t('Commercial catalog')} subtitle={t('{p} packs, {i} integrations, {a} add-ons and {b} bundles.', { p: cat.packs.length, i: cat.integrations.length, a: cat.addons.length, b: cat.bundles.length })} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'packs', label: t('Packs') }, { value: 'integrations', label: t('Integrations') }, { value: 'addons', label: t('Add-ons') }, { value: 'bundles', label: t('Bundles & pricing') }, { value: 'quote', label: t('Quote builder') }]} />
      {tab === 'packs' && (
        <div className="stack">
          <Card><BarChart data={cat.packs.map((p) => ({ label: p.id.replace('PACK-', 'P'), value: p.price }))} format={(v) => `$${v}`} caption={t('Suggested price per user per month for each pack; every pack is above the USD 40 minimum.')} height={200} /></Card>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {cat.packs.map((p) => (
              <Card key={p.id}>
                <div className="eyebrow">{p.id} · ${p.price} {t('per user per month')} · {t('min {n} users', { n: p.minUsers })}</div>
                <h3>{t(p.name)}</h3><p className="muted" style={{ marginTop: 4 }}>{t(p.segment)}</p>
                <dl className="kv small"><dt>{t('Behavior')}</dt><dd>{t(p.behavior)}</dd><dt>{t('Pain points')}</dt><dd>{t(p.painpoints)}</dd><dt>{t('Hopes')}</dt><dd>{t(p.hopes)}</dd><dt>{t('Fit')}</dt><dd>{t(p.fit)}</dd></dl>
                <div className="row" style={{ gap: 4, marginTop: 12 }}>{p.macroProcessText.map((m) => <Badge key={m}>{m.split(':')[0]}</Badge>)}</div>
                <p className="xs muted" style={{ marginTop: 8, marginBottom: 0 }}>{t('{i} integrations · {a} add-ons', { i: p.integrations[0] === 'ALL' ? 40 : p.integrations.length, a: p.addons[0] === 'ALL' ? 28 : p.addons.length })}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
      {tab === 'integrations' && <Card><DataTable csvName="integrations_catalog" rows={cat.integrations} pageSize={40} columns={[
        { key: 'id', label: t('ID') }, { key: 'name', label: t('Integration'), render: (i) => <><div className="strong">{t(i.name)}</div><div className="xs muted">{t(i.goal)}</div></> }, { key: 'category', label: t('Category'), render: (i) => t(i.category) },
        { key: 'examples', label: t('Example applications'), render: (i) => <span className="xs">{i.examples}</span> }, { key: 'value', label: t('Value'), render: (i) => <span className="xs">{t(i.value)}</span> },
        { key: 'packs', label: t('Packs'), csv: (i) => i.packs.join(' '), render: (i) => i.packs.join(', ') },
      ]} /></Card>}
      {tab === 'addons' && <Card><DataTable csvName="addons_catalog" rows={cat.addons} pageSize={40} columns={[
        { key: 'id', label: t('ID') }, { key: 'name', label: t('Add-on'), render: (a) => <><div className="strong">{t(a.name)}</div><div className="xs muted">{t(a.goal)}</div></> }, { key: 'category', label: t('Category'), render: (a) => t(a.category) },
        { key: 'value', label: t('Value'), render: (a) => <span className="xs">{t(a.value)}</span> }, { key: 'packs', label: t('Packs'), csv: (a) => a.packs.join(' '), render: (a) => (a.packs.includes('ALL') ? t('All packs') : a.packs.join(', ')) },
      ]} /></Card>}
      {tab === 'bundles' && (
        <div className="stack">
          <Card><CardHead title={t('Bundles: stated and recalculated savings')} subtitle={t('Recalculated as (sum of pack prices − bundle price) ÷ sum of pack prices.')} />
            <DataTable csvName="bundles" filterable={false} rows={cat.bundles.map((b) => ({ ...b, ...cat.bundleRecalc.find((r) => r.id === b.id) }))} columns={[
              { key: 'id', label: t('ID') }, { key: 'name', label: t('Bundle'), render: (b) => t(b.name) }, { key: 'packs', label: t('Packs'), csv: (b) => b.packs.join(' '), render: (b) => <span className="xs">{b.packs.join(', ')}</span> },
              { key: 'sum', label: t('Sum of packs') }, { key: 'price', label: t('Bundle price'), render: (b) => `$${b.price}` }, { key: 'stated', label: t('Stated savings') },
              { key: 'calculated', label: t('Calculated savings'), render: (b) => <Badge tone={Math.abs(parseFloat(b.stated) - parseFloat(b.calculated)) <= 1 ? 's4' : 's1'}>{b.calculated}</Badge> },
            ]} /></Card>
          <div className="grid two-even">
            <Card><CardHead title={t('Volume discounts')} /><DataTable filterable={false} rows={cat.volumeDiscounts} columns={[{ key: 'users', label: t('Users') }, { key: 'discount', label: t('Discount'), render: (v) => t(v.discount) }]} /></Card>
            <Card><CardHead title={t('Review notes')} /><ul className="list-plain small">{cat.reviewNotes.map((n) => <li key={n.n}><strong className="strong">{n.n}.</strong> {t(n.observation)} <span className="muted">→ {t(n.action)}</span></li>)}</ul></Card>
          </div>
        </div>
      )}
      {tab === 'quote' && <Quote cat={cat} />}
    </div>
  );
}
