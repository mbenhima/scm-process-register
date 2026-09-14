import { makeCrudRouter } from '../services/crud.js';

export default makeCrudRouter({
  table: 'ncp_sheet_templates',
  entityType: 'NcpSheetTemplate',
  fields: [
    'title', 'description', 'problem_type', 'default_criticality', 'default_priority',
    'title_template', 'description_template', 'is_active', 'created_by',
  ],
  permView: 'sheetTemplate.view',
  permCreate: 'sheetTemplate.create',
  permEdit: 'sheetTemplate.edit',
  permDelete: 'sheetTemplate.delete',
  orderBy: 'title ASC',
  beforeCreate: (body, req) => ({ ...body, created_by: req.user.id }),
});
