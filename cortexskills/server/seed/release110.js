// Release 1.10 seed: documented-information library, choice lists, OBS roles, prompt specs, audits,
// design releases, step records and generated documents for every run.
import { run, one, all } from '../src/db.js';
import { S, J, detUuid as U, now } from '../src/lib/util.js';
import { insertRecord } from '../src/services/projects.js';
import { seedLibrary } from '../src/services/docengine.js';

/** Platform template library (org_id NULL): one template per E2E deliverable plus the TER, plan, audit and master list. */
export function seedDocLibrary() {
  let n = 0;
  for (const t of seedLibrary()) { insertRecord(U('doctpl:' + t.code), 'DocumentTemplate', null, null, t.code, t); n++; }
  return n;
}
