import { makeCrudRouter } from '../services/crud.js';

export default makeCrudRouter({
  table: 'custom_kpis',
  entityType: 'CustomKpi',
  fields: ['code', 'title', 'description', 'formula_desc', 'target_value', 'ncp_stage', 'owner_id', 'is_active'],
  permView: 'customKpi.view',
  permCreate: 'customKpi.create',
  permEdit: 'customKpi.edit',
  permDelete: 'customKpi.delete',
  orderBy: 'code ASC',
  extraFilters: (req) => (req.query.ncp_stage ? { clause: 'ncp_stage = ?', params: [req.query.ncp_stage] } : null),
});
