// Shared version-history helper for platform-wide reference catalogs that need
// full CRUD plus "revert to any prior version" (AI Use Cases, Phase Templates).
// A revert is implemented as an edit whose patch is an old snapshot — it always
// moves the version number forward and adds a new history entry, so undoing a
// revert is itself just another revert. Nothing is ever destructively rewritten.

/** Returns entity with `patch` applied, the pre-edit fields snapshotted into versionHistory, and version bumped by 1. */
export function withVersionBump(entity, patch, note) {
  const { id, version, versionHistory, ...fields } = entity
  const prevVersion = version || 1
  const history = [
    ...(versionHistory || []),
    { version: prevVersion, savedAt: new Date().toISOString(), note: note || 'Edited', snapshot: fields },
  ]
  return { ...entity, ...patch, version: prevVersion + 1, versionHistory: history }
}

/** Returns entity reverted to a prior version's snapshot (a no-op if already at that version). */
export function revertEntityToVersion(entity, targetVersion) {
  if (!entity || targetVersion === entity.version) return entity
  const hist = entity.versionHistory || []
  const target = hist.find((h) => h.version === targetVersion)
  if (!target) return entity
  return withVersionBump(entity, target.snapshot, `Reverted to version ${targetVersion}`)
}
