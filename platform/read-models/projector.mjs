export function createProjection({ name, generatedAt = null, sourceStateVersion = 0, stale = false, data = {} }) {
  if (!name) throw new TypeError('projection name is required');
  if (!Number.isInteger(sourceStateVersion) || sourceStateVersion < 0) throw new TypeError('sourceStateVersion must be a non-negative integer');
  return Object.freeze({ name, generatedAt, sourceStateVersion, stale: Boolean(stale), data: Object.freeze({ ...data }) });
}

export function applyProjectionDelta(projection, { sourceStateVersion, generatedAt = null, stale = projection.stale, patch = {} }) {
  if (!projection) throw new TypeError('projection is required');
  if (!Number.isInteger(sourceStateVersion) || sourceStateVersion <= projection.sourceStateVersion) {
    throw new TypeError('delta sourceStateVersion must advance');
  }
  return createProjection({
    name: projection.name,
    generatedAt,
    sourceStateVersion,
    stale,
    data: { ...projection.data, ...patch },
  });
}
