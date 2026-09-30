// Entity types whose versions are restored by their own module (process design elements,
// OBS roles, AI prompt specifications). Each reverter receives (req, version row, data)
// and writes the restored content back; the generic route then records the new version.
export const REVERTERS = {};
export function registerReverter(type, fn) { REVERTERS[type] = fn; }
