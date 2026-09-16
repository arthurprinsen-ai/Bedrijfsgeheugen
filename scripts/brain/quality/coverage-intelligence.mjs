const GREEN = 'GREEN';
const UNKNOWN = new Set(['UNKNOWN','NOT_REGISTERED']);

export function buildCoverageReport({ surfaces = [], evidence = [] } = {}) {
  const evidenceBySurface = new Map(evidence.map(item => [String(item.surface_id), item]));
  const covered = [];
  const gaps = [];
  const unknown = [];
  const obligations = [];
  for (const surface of surfaces) {
    const current = evidenceBySurface.get(String(surface.id));
    if (current?.state === GREEN) {
      covered.push({ ...surface, evidence_state: GREEN, evidence: current.evidence ?? null });
      continue;
    }
    if (current && UNKNOWN.has(current.state)) {
      unknown.push({ ...surface, evidence_state: current.state });
      if (surface.required !== false) obligations.push({ surface_id: surface.id, state: current.state, authority: surface.authority, reason: 'required_surface_not_proven' });
      continue;
    }
    gaps.push({ ...surface, evidence_state: current?.state || 'MISSING' });
    if (surface.required !== false) obligations.push({ surface_id: surface.id, state: current?.state || 'MISSING', authority: surface.authority, reason: 'required_surface_missing_evidence' });
  }
  return Object.freeze({ covered, gaps, unknown, obligations, status: obligations.length ? 'BLOCKED' : 'GREEN' });
}
