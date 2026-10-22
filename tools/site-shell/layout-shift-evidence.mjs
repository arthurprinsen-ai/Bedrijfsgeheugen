// Public-page layout shift evidence only; no page text, URLs, or attribute values.
export const MAX_LAYOUT_SHIFT_EVENTS = 12;
const MAX_LAYOUT_SHIFT_SOURCES = 3;

function finiteCoordinate(value) {
  const n = Number(value);
  return value == null || !Number.isFinite(n) ? null : Math.round(n * 10) / 10;
}

function box(rect) {
  if (!rect || typeof rect !== 'object') return null;
  return Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, finiteCoordinate(rect[key])]));
}

export function normalizeLayoutShiftEvidence(events) {
  if (!Array.isArray(events)) return [];
  return events.slice(0, MAX_LAYOUT_SHIFT_EVENTS).map(event => ({
    score: Number.isFinite(Number(event?.score)) ? Math.round(Number(event.score) * 1e6) / 1e6 : null,
    sources: (Array.isArray(event?.sources) ? event.sources : []).slice(0, MAX_LAYOUT_SHIFT_SOURCES).map(source => ({
      tag: String(source?.tag || 'unknown').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0,24),
      id: String(source?.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0,48),
      previous: box(source?.previous),
      current: box(source?.current),
    })),
  }));
}

export function formatClsFailure(route, viewport, cls, events) {
  if (!Number.isFinite(cls) || cls <= 0.100) return null;
  const evidence = normalizeLayoutShiftEvidence(events);
  return [route, viewport + ':', 'CLS', cls.toFixed(3), 'exceeds 0.100;', 'layout_shift_sources=' + JSON.stringify(evidence)].join(' ');
}
