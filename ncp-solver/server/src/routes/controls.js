import { makeCrudRouter } from '../services/crud.js';

export default makeCrudRouter({
  table: 'controls',
  entityType: 'Control',
  fields: [
    'code', 'title', 'description', 'coso_component', 'control_type', 'frequency',
    'control_owner_id', 'effectiveness', 'last_tested_date', 'next_test_date',
    'evidence_notes', 'is_active',
  ],
  permView: 'control.view',
  permCreate: 'control.create',
  permEdit: 'control.edit',
  permDelete: 'control.delete',
  orderBy: 'code ASC',
});
