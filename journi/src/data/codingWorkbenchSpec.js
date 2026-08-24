// Module 11 — Qualitative Coding Workbench capability spec (D32k): the engine
// AIUC-12/AIUC-13 actually run on, shown as a reference so the workbench UI's
// four tabs are traceable back to their source capability.
const codingWorkbenchSpec = [
  {
    id: 'QCW-01',
    capability: 'Codebook management',
    input: 'Organization-scoped codebook definition',
    output: 'Versioned, active codebook',
    poweredUseCase: 'AIUC-13',
    humanRole: 'Change Manager defines/edits codes',
    description: "A configurable set of codes a Change Manager maintains per engagement — not a fixed platform-wide taxonomy.",
  },
  {
    id: 'QCW-02',
    capability: 'Note tagging',
    input: '1:1 coaching notes, resistance log entries',
    output: 'Code tags applied against the active codebook',
    poweredUseCase: 'AIUC-13',
    humanRole: 'Change Manager applies or removes each tag',
    description: 'The core engine behind AIUC-13.',
  },
  {
    id: 'QCW-03',
    capability: 'Code frequency rollup',
    input: 'Tagged notes for a project',
    output: 'Frequency table of codes across all tagged material',
    poweredUseCase: null,
    humanRole: 'Change Manager reviews rollup',
    description: 'Feeds pattern recognition across many 1:1s/observations that reading each note individually would likely miss.',
  },
  {
    id: 'QCW-04',
    capability: 'Cross-reference to Resistance Log',
    input: 'Coded material referencing a specific barrier',
    output: 'Linked resistance-log record, or flagged as a new one',
    poweredUseCase: 'AIUC-12',
    humanRole: 'Change Manager confirms the link',
    description: 'Closes the loop between qualitative coding (this workbench) and structured resistance tracking (M11).',
  },
]

export default codingWorkbenchSpec
