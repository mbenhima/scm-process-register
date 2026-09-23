// Structured inputs captured at each user-facing task (UFT). Every work task also records a required
// "Result / output" text. Fields with an `effect` feed business rules (BR-001, BR-002, BR-030 ...).
const num = (key, label, extra = {}) => ({ key, label, type: 'number', ...extra });
const txt = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });
const sel = (key, label, options, extra = {}) => ({ key, label, type: 'select', options, ...extra });
const cash = (prefix) => [
  num('investment', 'Investment (kUSD)', { required: true, min: 1, hint: 'One-off investment needed, in thousands of USD.' }),
  num('annual_cash_flow', 'Expected net cash flow per year (kUSD)', { required: true, hint: 'Average yearly net cash inflow once launched.' }),
  num('years', 'Evaluation horizon (years)', { required: true, min: 1, max: 15 }),
  num('discount_rate', 'Discount rate (%)', { required: true, min: 0, max: 50 }),
].map((f) => ({ ...f, effect: prefix }));

export const TASK_FORMS = {
  'UFT-01-01': [sel('idea_source', 'Idea source', ['Internal - employee', 'Internal - strategy', 'Customer request', 'Market trend', 'Partner', 'Regulation'], { required: true }), txt('idea_statement', 'One-sentence idea statement', { required: true })],
  'UFT-01-02': [txt('target_segment', 'Target segment', { required: true }), num('market_size', 'Addressable market (MUSD)', { min: 0 }), num('strategic_fit', 'Strategic-fit score (0-100)', { required: true, min: 0, max: 100, effect: 'BR-001', hint: 'Below 50 parks the idea (BR-001).' })],
  'UFT-01-03': cash('BR-002'),
  'UFT-01-04': [txt('top_risk', 'Main risk identified', { required: true }), num('likelihood', 'Likelihood (1-5)', { required: true, min: 1, max: 5 }), num('impact', 'Impact (1-5)', { required: true, min: 1, max: 5, effect: 'RISK' }), sel('regulated', 'Regulated product?', ['Yes', 'No'], { required: true })],
  'UFT-01-05': [txt('capabilities', 'Key capabilities and skills needed', { required: true })],
  'UFT-01-06': [sel('portfolio_fit', 'Portfolio position', ['Core', 'Adjacent', 'Transformational'], { required: true }), txt('roadmap_slot', 'Roadmap slot (e.g. 2027-Q2)')],
  'UFT-02-02': cash('BR-002'),
  'UFT-02-05': [num('gross_margin', 'Expected gross margin (%)', { required: true, min: -100, max: 100 })],
  'UFT-02-06': [txt('regulations', 'Applicable regulations and standards', { required: true })],
  'UFT-02-07': [sel('feasibility', 'Technical feasibility', ['High', 'Medium', 'Low'], { required: true })],
  'UFT-04-05': [num('acceptance_pass_rate', 'Acceptance tests passed (%)', { required: true, min: 0, max: 100 })],
  'UFT-05-02': [{ key: 'planned_launch_date', label: 'Planned launch date', type: 'date', required: true, effect: 'LAUNCH' }],
  'UFT-05-06': [num('people_trained', 'People trained', { required: true, min: 0 })],
  'UFT-05-08': [sel('approvals_complete', 'All regulatory approvals obtained?', ['Yes', 'No'], { required: true, effect: 'BR-030', hint: 'Go-live is blocked while approvals are incomplete (BR-030).' })],
  'UFT-06-01': [num('issues_open', 'Open product issues', { required: true, min: 0 })],
  'UFT-06-04': [num('csat', 'CSAT (1-5)', { required: true, min: 1, max: 5, step: 0.1 }), num('nps', 'Net Promoter Score (-100 to 100)', { required: true, min: -100, max: 100 })],
  'UFT-06-05': [num('mtbf_hours', 'Field MTBF (hours)', { min: 0 })],
  'UFT-07-02': [num('revenue', 'Revenue to date (kUSD)', { required: true, min: 0 }), num('cogs', 'Cost of goods sold (kUSD)', { required: true, min: 0 })],
  'UFT-07-03': [num('csat', 'CSAT (1-5)', { required: true, min: 1, max: 5, step: 0.1 }), num('nps', 'Net Promoter Score (-100 to 100)', { required: true, min: -100, max: 100 })],
  'UFT-07-04': [sel('recommendation', 'Recommendation to the T5 gate', ['Continue', 'Relaunch', 'Retire'], { required: true })],
  'UFT-08-04': [sel('reentry', 'Relaunch re-entry point', ['E2E-03', 'E2E-04', 'E2E-05'], { required: true, hint: 'Branch A loops back to Design (E2E-03), Development (E2E-04) or Launch (E2E-05).' })],
  'UFT-08-09': [num('customers_affected', 'Customers affected', { required: true, min: 0 }), num('customers_migrated', 'Customers migrated', { required: true, min: 0 })],
  'UFT-08-10': [num('closure_cost', 'Closure cost (kUSD)', { min: 0 })],
  'UFT-09-08': [num('leads', 'Qualified leads generated', { min: 0 }), num('conversion', 'Conversion rate (%)', { min: 0, max: 100 })],
};

export const formFor = (uftId) => TASK_FORMS[uftId] || [];

export function validateTaskData(uftId, data = {}) {
  const errors = [];
  for (const f of formFor(uftId)) {
    const v = data[f.key];
    const empty = v === undefined || v === null || String(v).trim() === '';
    if (f.required && empty) { errors.push(`${f.label} is required.`); continue; }
    if (empty) continue;
    if (f.type === 'number') {
      const n = Number(v);
      if (Number.isNaN(n)) errors.push(`${f.label} must be a number.`);
      else if (f.min !== undefined && n < f.min) errors.push(`${f.label} must be at least ${f.min}.`);
      else if (f.max !== undefined && n > f.max) errors.push(`${f.label} must be at most ${f.max}.`);
    }
    if (f.type === 'select' && !f.options.includes(v)) errors.push(`${f.label}: choose one of ${f.options.join(', ')}.`);
    if (f.type === 'date' && Number.isNaN(Date.parse(v))) errors.push(`${f.label} must be a date (YYYY-MM-DD).`);
  }
  return errors;
}

// ACT-02: NPV / ROI / payback from a level annual cash flow.
export function businessCase({ investment, annual_cash_flow, years, discount_rate }) {
  const I = Number(investment); const cf = Number(annual_cash_flow); const n = Number(years); const r = Number(discount_rate) / 100;
  let npv = -I;
  for (let t = 1; t <= n; t += 1) npv += cf / (1 + r) ** t;
  return { npv: Math.round(npv), roi: Math.round(((cf * n - I) / I) * 1000) / 10, payback: cf > 0 ? Math.round((I / cf) * 10) / 10 : null };
}
