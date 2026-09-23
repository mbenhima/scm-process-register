import { Router } from 'express';
import { q } from '../db.js';
import { requirePerm } from '../lib/security.js';
import { REPORTS, buildReport } from '../reports/index.js';
import { toPdf, toXlsx, toDocx, ganttPdf, fileName } from '../reports/export.js';
import { wbsTree } from './intelligence.js';
import { audit } from '../lib/audit.js';
import { h, ctxOf, notFound } from './util.js';

const r = Router();
const MIME = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

r.get('/reports', requirePerm('report.view'), (req, res) => res.json(REPORTS));
r.get('/reports/:id', requirePerm('report.view'), h((req) => { const rep = buildReport(req.orgId, req.params.id); if (!rep) throw notFound('Report not found.'); return rep; }));

r.get('/reports/:id/export/:format', requirePerm('report.export'), async (req, res) => {
  const { id, format } = req.params;
  if (!MIME[format]) return res.status(400).json({ error: 'Format must be pdf, xlsx or docx.' });
  try {
    const rep = buildReport(req.orgId, id);
    if (!rep) return res.status(404).json({ error: 'Report not found.' });
    res.setHeader('Content-Type', MIME[format]);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName(id, format)}"`);
    audit(ctxOf(req), 'report', id, 'export', { format: [null, format] });
    if (format === 'pdf') return toPdf(rep).pipe(res);
    const buf = format === 'xlsx' ? await toXlsx(rep) : await toDocx(rep);
    res.end(Buffer.from(buf));
  } catch (e) {
    console.error('[report export]', e);
    if (!res.headersSent) res.status(500).json({ error: 'The export could not be generated. No data was changed.' }); // NFR-DA-REL-03
  }
});

r.get('/wbs/:id/export/pdf', requirePerm('wbs.view'), (req, res) => {
  const w = q.get('SELECT * FROM wbs WHERE id = ? AND org_id = ?', req.params.id, req.orgId);
  if (!w) return res.status(404).json({ error: 'Not found.' });
  res.setHeader('Content-Type', MIME.pdf);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName(`WBS-${w.id}`, 'pdf')}"`);
  ganttPdf(w, wbsTree(w.id)).pipe(res);
});

export default r;
