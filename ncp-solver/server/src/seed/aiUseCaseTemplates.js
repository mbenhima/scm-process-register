export const AI_USE_CASE_TEMPLATES = {
  public_infrastructure: [
    { title: 'Predictive maintenance for structural sensors', business_function: 'operations', ai_technique: 'predictive_analytics', maturity_stage: 3, status: 'pilot', expected_impact: 'Reduce unplanned bridge/road asset downtime by anticipating sensor-detected structural anomalies.' },
    { title: 'Computer vision for site safety compliance (PPE detection)', business_function: 'operations', ai_technique: 'computer_vision', maturity_stage: 2, status: 'pilot', expected_impact: 'Automatically flag missing PPE (harnesses, helmets) from site CCTV feeds to reduce HSE incidents.' },
    { title: 'RAG-based standards and permits assistant', business_function: 'quality', ai_technique: 'rag', maturity_stage: 4, status: 'production', expected_impact: 'Give engineers instant, cited answers from thousands of pages of codes, permits and past NCP resolutions.' },
    { title: 'Traffic management plan anomaly detection', business_function: 'operations', ai_technique: 'anomaly_detection', maturity_stage: 1, status: 'idea', expected_impact: 'Detect when on-site signage photos do not match the currently approved traffic management plan.' },
  ],
  manufacturing: [
    { title: 'Vision-based casting porosity inspection', business_function: 'quality', ai_technique: 'computer_vision', maturity_stage: 4, status: 'production', expected_impact: 'Automate X-ray defect detection to catch porosity issues earlier than manual sampling.' },
    { title: 'Predictive maintenance for CNC tool wear', business_function: 'maintenance', ai_technique: 'predictive_analytics', maturity_stage: 3, status: 'pilot', expected_impact: 'Predict tool wear drift to trigger recalibration before dimensional non-conformities occur.' },
    { title: 'NCP root-cause recommendation assistant', business_function: 'quality', ai_technique: 'rag', maturity_stage: 4, status: 'production', expected_impact: 'Surface similar historical non-conformities and proven corrective actions during root cause analysis.' },
    { title: 'Supply chain anomaly detection for calibration compliance', business_function: 'supply_chain', ai_technique: 'anomaly_detection', maturity_stage: 2, status: 'pilot', expected_impact: 'Flag tooling and instruments approaching calibration expiry before they cause non-conformities.' },
  ],
  agro_business: [
    { title: 'Cold-chain temperature anomaly detection', business_function: 'supply_chain', ai_technique: 'anomaly_detection', maturity_stage: 3, status: 'pilot', expected_impact: 'Real-time alerts on temperature excursions during transport to prevent spoilage and food-safety incidents.' },
    { title: 'Pesticide application & MRL compliance optimizer', business_function: 'operations', ai_technique: 'optimization', maturity_stage: 2, status: 'idea', expected_impact: 'Recommend safe application windows respecting pre-harvest intervals to avoid MRL breaches.' },
    { title: 'Yield & spoilage prediction from IoT silo sensors', business_function: 'operations', ai_technique: 'predictive_analytics', maturity_stage: 3, status: 'pilot', expected_impact: 'Predict spoilage risk from humidity/temperature trends to trigger proactive aeration.' },
    { title: 'Food-safety knowledge base assistant (HACCP/RAG)', business_function: 'quality', ai_technique: 'rag', maturity_stage: 4, status: 'production', expected_impact: 'Instant, source-cited HACCP and allergen-control guidance for QA staff during changeovers.' },
  ],
  real_estate: [
    { title: 'Snag-list defect classification from inspection photos', business_function: 'quality', ai_technique: 'computer_vision', maturity_stage: 2, status: 'pilot', expected_impact: 'Auto-classify and prioritize handover snag-list defects from mobile inspection photos.' },
    { title: 'Schedule-risk prediction for long-lead procurement', business_function: 'operations', ai_technique: 'predictive_analytics', maturity_stage: 2, status: 'idea', expected_impact: 'Flag long-lead items (elevators, façade) at risk of delay whenever the master schedule shifts.' },
    { title: 'As-built vs. sales-material consistency checker', business_function: 'quality', ai_technique: 'anomaly_detection', maturity_stage: 1, status: 'idea', expected_impact: 'Detect discrepancies between published sales materials and the latest as-built drawings.' },
    { title: 'Compliance & fire-code RAG assistant', business_function: 'quality', ai_technique: 'rag', maturity_stage: 4, status: 'production', expected_impact: 'Give compliance officers instant answers on fire codes and building regulations with citations.' },
  ],
};
