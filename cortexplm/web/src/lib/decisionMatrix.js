// Decision matrix for the complexity scores of a new project (Part 7.3). Levels 1, 3 and 5 come from the
// Process Design Reference; levels 2 and 4 describe the cases in between so two people score the same way.
export const SCORING_MATRIX = [
  { key: 'strategic', label: 'Strategic impact', levels: ['Incremental change to an existing offer', 'Improvement customers notice, same segment', 'New segment or product-line extension', 'Major extension that changes the competitive position', 'New platform or business model'] },
  { key: 'investment', label: 'Investment level', levels: ["Within the business unit's delegated authority", 'Up to twice the delegated authority, one budget line', 'Requires portfolio-level approval', 'Funding over several years or a large share of the portfolio budget', 'Requires executive or board approval'] },
  { key: 'novelty', label: 'Technical novelty', levels: ['Known technology; configuration change', 'Known technologies in a new combination', 'Adaptation of existing technology', 'Technology new to the organization but proven elsewhere', 'New technology or architecture'] },
  { key: 'regulatory', label: 'Regulatory and safety exposure', levels: ['No new certification needed', 'Update of an existing declaration or file', 'Standard certifications or declarations', 'New approval by an authority or a notified body', 'Regulated or safety-critical product'] },
  { key: 'market', label: 'Market scope', levels: ['One market, existing channel', 'One market, new segment or adapted channel', 'Several markets or a new channel', 'Several regions with local adaptations', 'Multi-market or global launch'] },
  { key: 'reach', label: 'Cross-functional reach', levels: ['1 to 2 functions', '2 to 3 functions with light coordination', '3 to 5 functions', 'More than 5 functions', 'More than 5 functions or external partners'] },
  { key: 'integration', label: 'Product-service integration', levels: ['Product-only or service-only change', 'Service sold separately around a product', 'Change to an existing bundle', 'New bundle of existing products and services', 'New integrated or outcome-based offer'] },
];

export const TRACK_THRESHOLDS = [
  ['7 – 14', 'Fast Track', 'Not allowed if any criterion scores 5.'],
  ['15 – 24', 'Light Track', 'Light is the minimum when regulatory and safety exposure scores 4 or more.'],
  ['25 – 35', 'Full Track', 'Mandatory for any safety-critical product, whatever the total.'],
];
