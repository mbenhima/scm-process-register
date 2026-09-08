/**
 * requirePermission(code) - blocks the request unless the authenticated user
 * holds the given permission code through at least one assigned role.
 * The 'admin' role always has every permission (seeded with the full catalog).
 */
export function requirePermission(code) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
    if (!code) return next();
    if (req.user.permissions.has(code)) return next();
    return res.status(403).json({ error: 'forbidden', required: code });
  };
}

export function requireAnyPermission(...codes) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
    if (codes.some((c) => req.user.permissions.has(c))) return next();
    return res.status(403).json({ error: 'forbidden', required: codes });
  };
}
