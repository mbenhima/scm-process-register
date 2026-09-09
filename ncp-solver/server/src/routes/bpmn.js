import { makeCrudRouter } from '../services/crud.js';

export default makeCrudRouter({
  table: 'bpmn_diagrams',
  entityType: 'BpmnDiagram',
  fields: ['code', 'title', 'description', 'xml', 'obs_node_id', 'updated_by'],
  permView: 'bpmn.view',
  permCreate: 'bpmn.create',
  permEdit: 'bpmn.edit',
  permDelete: 'bpmn.delete',
  orderBy: 'code ASC',
  beforeCreate: (body, req) => ({ ...body, updated_by: req.user.id }),
});
