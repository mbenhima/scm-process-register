const B = 'http://localhost:4100/api';
(async () => {
  const tok = (await (await fetch(B + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'exec@ridgeway.example', password: 'Demo#2026' }) })).json()).token;
  const g = async (p) => (await fetch(B + p, { headers: { authorization: 'Bearer ' + tok } })).json();
  const out = { org: await g('/benchmark/organization?dimension=offer_type'), track: await g('/benchmark/organization?dimension=track'), group: await g('/benchmark/group') };
  require('fs').writeFileSync(process.argv[2], JSON.stringify(out));
  for (const k of ['org', 'track', 'group']) console.log(k, out[k].rows.map((r) => `${r.segment}: go ${r.metrics.go_rate} ttm ${r.metrics.time_to_market_days} npv ${r.metrics.avg_npv}`).join(' | '));
})();
