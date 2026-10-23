// Pure fail-closed viewport partition. The legacy standalone sweep still
// runs all three when no shard is supplied; matrix jobs select exactly one.
export const REQUIRED_VISIBILITY_VIEWPORTS = Object.freeze([
  Object.freeze({ name: 'phone', width: 390, height: 844 }),
  Object.freeze({ name: 'tablet', width: 768, height: 1024 }),
  Object.freeze({ name: 'desktop', width: 1440, height: 900 })
]);

export function selectVisibilityViewports(shard = '') {
  if (typeof shard !== 'string') throw new Error('VISIBILITY_VIEWPORT_SHARD_INVALID_TYPE');
  const requested = shard.trim();
  if (!requested) return REQUIRED_VISIBILITY_VIEWPORTS;
  const selected = REQUIRED_VISIBILITY_VIEWPORTS.filter(viewport => viewport.name === requested);
  if (selected.length !== 1) throw new Error(`VISIBILITY_VIEWPORT_SHARD_UNKNOWN:${requested}`);
  return selected;
}
