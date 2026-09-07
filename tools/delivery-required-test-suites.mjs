const ALLOWED_LANES = Object.freeze(['backend', 'portal', 'website', 'automation']);

export function deriveRequiredTestSuites({ lanes = [] } = {}) {
  const normalized = [...new Set(lanes.map(value => String(value).trim()).filter(Boolean))];
  const unknown = normalized.filter(lane => !ALLOWED_LANES.includes(lane));
  if (unknown.length) throw new Error(`unknown required-test lane: ${unknown.join(', ')}`);
  const active = new Set(normalized);
  return Object.freeze({
    shared: true,
    backend: active.has('backend'),
    portal: active.has('portal'),
    website: active.has('website'),
    automation: active.has('automation'),
  });
}
