// Shared option lists for governance forms.
export const COSO = ['Control Environment', 'Risk Assessment', 'Control Activities', 'Information & Communication', 'Monitoring Activities'];
export const SEVERITY = ['Low', 'Medium', 'High', 'Critical'];
export const useObsOptions = (obs) => (obs || []).map((n) => ({ value: n.id, label: n.name }));
