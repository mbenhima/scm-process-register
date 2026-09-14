import { makeCrudRouter } from '../services/crud.js';

export default makeCrudRouter({
  table: 'business_rules',
  entityType: 'BusinessRule',
  fields: [
    'code', 'title', 'description', 'rule_type', 'applies_to_module',
    'condition_text', 'action_text', 'severity', 'owner_id', 'obs_node_id', 'ncp_stage', 'is_active',
  ],
  permView: 'businessRule.view',
  permCreate: 'businessRule.create',
  permEdit: 'businessRule.edit',
  permDelete: 'businessRule.delete',
  orderBy: 'code ASC',
  extraFilters: (req) => (req.query.ncp_stage ? { clause: 'ncp_stage = ?', params: [req.query.ncp_stage] } : null),
});
