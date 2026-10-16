// Edition compiled into a runtime build: 'customer' hides every commercial element (prices) and
// licence issuing; 'editor' and 'dev' (run from the source) show them.
/* global __EDITION__ */
export const EDITION = typeof __EDITION__ !== 'undefined' ? __EDITION__ : 'dev';
export const COMMERCIAL = EDITION !== 'customer';
export const LICENCE_ISSUING = EDITION !== 'customer';
