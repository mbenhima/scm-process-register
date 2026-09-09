import { makeCrudRouter } from '../services/crud.js';

export default makeCrudRouter({
  table: 'business_rules',
  entityType: 'BusinessRule',
  fields: [
    'code', 'title', 'description', 'rule_type', 'applies_to_module',
    'condition_text', 'action_text', 'severity', 'owner_id', 'obs_node_id', 'is_active',
  ],
  permView: 'businessRule.view',
  permCreate: 'businessRule.create',
  permEdit: 'businessRule.edit',
  permDelete: 'businessRule.delete',
  orderBy: 'code ASC',
});
