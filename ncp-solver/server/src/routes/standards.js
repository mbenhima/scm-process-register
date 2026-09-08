import { makeCrudRouter } from '../services/crud.js';

export default makeCrudRouter({
  table: 'standards',
  entityType: 'Standard',
  fields: ['code', 'title', 'description', 'version', 'is_active', 'effective_date', 'document_link'],
  permView: 'standard.view',
  permCreate: 'standard.create',
  permEdit: 'standard.edit',
  permDelete: 'standard.delete',
  orderBy: 'code ASC',
});
