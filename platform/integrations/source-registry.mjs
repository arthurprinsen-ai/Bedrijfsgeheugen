export const SOURCE_KINDS = Object.freeze({
  BEDRIJFSGEHEUGEN: 'bedrijfsgeheugen',
  NOTION: 'notion',
  MAKE: 'make',
  CRM: 'crm',
  ERP: 'erp',
  HR: 'hr',
  FILE: 'file',
  EXTERNAL: 'external',
});

export function createSourceRegistry(entries = []) {
  const byDataType = new Map();
  for (const entry of entries) {
    if (!entry?.dataType || !entry?.sourceKind || !entry?.sourceRef) throw new TypeError('source registry entry requires dataType, sourceKind and sourceRef');
    if (byDataType.has(entry.dataType)) throw new TypeError(`duplicate source-of-record for ${entry.dataType}`);
    byDataType.set(entry.dataType, Object.freeze({ ...entry }));
  }
  return Object.freeze({
    get(dataType) { return byDataType.get(dataType) ?? null; },
    list() { return Object.freeze([...byDataType.values()]); },
  });
}

export function createSourceConflict({ id, tenantId, dataType, candidates, reason }) {
  if (!id || !tenantId || !dataType || !Array.isArray(candidates) || candidates.length < 2) throw new TypeError('source conflict requires id, tenantId, dataType and at least two candidates');
  return Object.freeze({ id, type: 'SourceConflict', tenantId, dataType, candidates: Object.freeze(candidates.map(c => Object.freeze({ ...c }))), reason: reason ?? 'authoritative sources disagree', status: 'Open' });
}
