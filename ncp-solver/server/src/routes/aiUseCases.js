import { makeCrudRouter } from '../services/crud.js';

export default makeCrudRouter({
  table: 'ai_use_cases',
  entityType: 'AIUseCase',
  fields: [
    'title', 'title_fr', 'title_ar', 'description', 'sector', 'business_function',
    'ai_technique', 'maturity_stage', 'status', 'owner_id', 'expected_impact', 'estimated_roi', 'tags',
  ],
  permView: 'aiUseCase.view',
  permCreate: 'aiUseCase.create',
  permEdit: 'aiUseCase.edit',
  permDelete: 'aiUseCase.delete',
});
