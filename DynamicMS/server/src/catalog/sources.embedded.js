// Runtime build: the catalog sources compiled into the server (no data file on disk).
import en from '../../seed/catalog/catalog.en.json';
import dict from '../../seed/catalog/i18n.json';

export function readSources() {
  return { en: structuredClone(en), dict: structuredClone(dict) };
}
