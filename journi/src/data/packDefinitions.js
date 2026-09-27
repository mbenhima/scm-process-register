// D-Config: Solution Pack definitions, mirroring the DynamicJourni Technical
// & Solution Offer's three-Pack structure (Trailhead / Waypoint / Horizon).
// Each Pack lists which module routes are included, so the Configuration
// Management module (M-Config) can flip data.packConfig.enabledModules to a
// known-good set with one click, while still letting a Super/Group/Org Admin
// hand-edit the set afterwards (data.packConfig.customOverride = true once
// they diverge from the Pack's stock list).
//
// Route ids below are the internal /app/m<n> path segments (NOT the
// display "M<n>" numbers shown in the sidebar — see Sidebar.jsx's comment
// for why the two numbering schemes differ).
export const PACKS = ['trailhead', 'waypoint', 'horizon']

export const TRAILHEAD_MODULES = ['m1', 'm2', 'm3', 'm17', 'm4', 'm5', 'm13', 'm15']
// M1 Hierarchy, M2 Identity&RBAC, M7 Initiative Registry(m3), M8 WBS&Gantt(m17),
// M9 Stakeholder Mapping(m4), M10 ADKAR(m5), M12 Risk Register(m13), M18 Journey Map(m15)

export const WAYPOINT_MODULES = [
  ...TRAILHEAD_MODULES,
  'm22', // M3 OBS
  'm18', // M4 Process Registry
  'm19', // M5 CM Charters
  'm6', // M11 Emotional & Transition
  'm7', // M13 Sponsor & Coalition
  'm8', // M14 Communications
  'm9', // M15 Training
  'm10', // M16 Resistance
  'm11', // M17 Manager as Coach
]

export const HORIZON_MODULES = [
  ...WAYPOINT_MODULES,
  'm16', // M6 AI Use Case Library & Governance
  'm20', // M19 Journeys & Analytics
  'm14', // M20 Analytics
  'm12', // M21 Sustainment
  'm21', // M22 Field Notes
]

export const PACK_DEFINITIONS = {
  trailhead: {
    key: 'trailhead',
    modules: TRAILHEAD_MODULES,
    aiTier: 'assistive',
    aiUseCaseCount: 5,
    maxOrganizations: 1,
    rbacRoleSet: 'writeCapable', // 5 write-capable roles only
    frameworks: ['adkar'],
    phaseTemplateLimit: 1,
    deploymentOptions: ['dedicated_cloud', 'group_cloud'],
    sovereignSuiteStandard: false,
  },
  waypoint: {
    key: 'waypoint',
    modules: WAYPOINT_MODULES,
    aiTier: 'augmented',
    aiUseCaseCount: 9,
    maxOrganizations: 5,
    rbacRoleSet: 'full',
    frameworks: ['adkar', 'lewin', 'bridges'],
    phaseTemplateLimit: 8,
    deploymentOptions: ['dedicated_cloud', 'group_cloud'],
    sovereignSuiteStandard: false,
  },
  horizon: {
    key: 'horizon',
    modules: HORIZON_MODULES,
    aiTier: 'augmented',
    aiUseCaseCount: 14,
    maxOrganizations: null, // unlimited
    rbacRoleSet: 'full',
    frameworks: ['adkar', 'lewin', 'bridges'],
    phaseTemplateLimit: null, // full library + custom authoring
    deploymentOptions: ['dedicated_cloud', 'group_cloud', 'hybrid_shield', 'sovereign_core', 'sovereign_vault'],
    sovereignSuiteStandard: true,
  },
}

export const DEPLOYMENT_OPTIONS = [
  { key: 'dedicated_cloud', appRunsOn: 'customer_cloud', aiRunsOn: 'customer_cloud' },
  { key: 'group_cloud', appRunsOn: 'customer_cloud', aiRunsOn: 'customer_cloud' },
  { key: 'hybrid_shield', appRunsOn: 'on_prem', aiRunsOn: 'customer_cloud' },
  { key: 'sovereign_core', appRunsOn: 'on_prem', aiRunsOn: 'on_prem' },
  { key: 'sovereign_vault', appRunsOn: 'on_prem_air_gapped', aiRunsOn: 'on_prem_air_gapped' },
]
