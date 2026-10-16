// Source documents of the catalog, read from seed/catalog. A runtime build replaces this module
// with sources.embedded.js, which compiles the same data into the server.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../config.js';

const DIR = path.join(ROOT, 'seed', 'catalog');

export function readSources() {
  const en = JSON.parse(fs.readFileSync(path.join(DIR, 'catalog.en.json'), 'utf8'));
  const dict = JSON.parse(fs.readFileSync(path.join(DIR, 'i18n.json'), 'utf8'));
  return { en, dict };
}
