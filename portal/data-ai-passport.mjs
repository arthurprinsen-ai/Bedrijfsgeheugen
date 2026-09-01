export const PASSPORT_STATUS = Object.freeze({
  VERIFIED: 'verified',
  CONFIGURED: 'configured',
  NEEDS_EVIDENCE: 'needs_evidence',
});

const VALID_STATUS = new Set(Object.values(PASSPORT_STATUS));
const hasValue = value => value !== null && value !== undefined && value !== '';
const asEvidence = value => Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];

export function deriveEvidenceStatus({ value, requestedStatus, evidence } = {}) {
  if (!hasValue(value)) return PASSPORT_STATUS.NEEDS_EVIDENCE;
  const requested = VALID_STATUS.has(requestedStatus) ? requestedStatus : PASSPORT_STATUS.NEEDS_EVIDENCE;
  if (requested === PASSPORT_STATUS.VERIFIED) {
    return asEvidence(evidence).length > 0 ? PASSPORT_STATUS.VERIFIED : PASSPORT_STATUS.NEEDS_EVIDENCE;
  }
  if (requested === PASSPORT_STATUS.CONFIGURED) return PASSPORT_STATUS.CONFIGURED;
  return PASSPORT_STATUS.NEEDS_EVIDENCE;
}

function normalizeEvidence(evidence) {
  return asEvidence(evidence).map(item => Object.freeze({
    type: String(item.type || 'unknown'),
    source: String(item.source || 'unknown'),
    reference: item.reference ? String(item.reference) : null,
    checkedAt: item.checkedAt || null,
  }));
}

function normalizeRecord(input = {}, valueKey = 'value') {
  const evidence = normalizeEvidence(input.evidence);
  const value = input[valueKey] ?? input.value ?? null;
  return Object.freeze({
    ...input,
    evidence,
    status: deriveEvidenceStatus({ value, requestedStatus: input.requestedStatus, evidence }),
    requestedStatus: undefined,
  });
}

function normalizeOwnership(input = {}) {
  const owner = input.owner || null;
  const evidence = normalizeEvidence(input.evidence);
  return Object.freeze({
    owner,
    controller: input.controller || null,
    roleNote: input.roleNote || null,
    evidence,
    status: deriveEvidenceStatus({ value: owner, requestedStatus: input.requestedStatus, evidence }),
  });
}

function normalizeAutomation(input = {}) {
  const evidence = normalizeEvidence(input.evidence);
  const provider = input.provider || null;
  return Object.freeze({
    provider,
    role: input.role || null,
    zone: input.zone || null,
    state: input.state || null,
    scenarioIds: Array.isArray(input.scenarioIds) ? [...input.scenarioIds] : [],
    evidence,
    status: deriveEvidenceStatus({ value: provider, requestedStatus: input.requestedStatus, evidence }),
  });
}

function normalizeAiSystem(input = {}) {
  const evidence = normalizeEvidence(input.evidence);
  const provider = input.provider || null;
  const aiActInput = input.aiAct || {};
  const aiActEvidence = normalizeEvidence(aiActInput.evidence);
  const riskClass = aiActInput.riskClass || null;
  return Object.freeze({
    provider,
    model: input.model || null,
    purpose: input.purpose || null,
    trainingUse: hasValue(input.trainingUse) ? input.trainingUse : null,
    processingRegion: input.processingRegion || null,
    humanOversight: input.humanOversight || null,
    evidence,
    status: deriveEvidenceStatus({ value: provider, requestedStatus: input.requestedStatus, evidence }),
    aiAct: Object.freeze({
      role: aiActInput.role || null,
      riskClass,
      transparencyDuty: aiActInput.transparencyDuty || null,
      evidence: aiActEvidence,
      status: riskClass && riskClass !== 'unclassified'
        ? deriveEvidenceStatus({ value: riskClass, requestedStatus: aiActInput.requestedStatus, evidence: aiActEvidence })
        : PASSPORT_STATUS.NEEDS_EVIDENCE,
    }),
  });
}

function normalizeArray(items, fn) {
  return Object.freeze((Array.isArray(items) ? items : []).map(fn));
}

export function createDataAiPassport(input = {}) {
  const assertionsInput = input.assertions || {};
  const allDataEvidence = normalizeEvidence(assertionsInput.allDataWithinEer?.evidence);
  const allDataValue = assertionsInput.allDataWithinEer?.value ?? null;
  return Object.freeze({
    schemaVersion: 1,
    tenantId: input.tenantId || null,
    tenantName: input.tenantName || null,
    generatedAt: input.generatedAt || new Date().toISOString(),
    ownership: normalizeOwnership(input.ownership),
    storage: normalizeArray(input.storage, item => normalizeRecord(item, 'provider')),
    processing: normalizeArray(input.processing, item => normalizeRecord(item, 'provider')),
    automation: normalizeArray(input.automation, normalizeAutomation),
    aiSystems: normalizeArray(input.aiSystems, normalizeAiSystem),
    subprocessors: normalizeArray(input.subprocessors, item => normalizeRecord(item, 'name')),
    retention: normalizeArray(input.retention, item => normalizeRecord(item, 'period')),
    transfers: normalizeArray(input.transfers, item => normalizeRecord(item, 'destination')),
    exportDeletion: Object.freeze({
      export: normalizeRecord(input.exportDeletion?.export || {}, 'available'),
      deletion: normalizeRecord(input.exportDeletion?.deletion || {}, 'available'),
    }),
    audit: normalizeArray(input.audit, item => normalizeRecord(item, 'event')),
    assertions: Object.freeze({
      allDataWithinEer: Object.freeze({
        value: allDataValue,
        evidence: allDataEvidence,
        status: deriveEvidenceStatus({
          value: allDataValue,
          requestedStatus: assertionsInput.allDataWithinEer?.requestedStatus,
          evidence: allDataEvidence,
        }),
      }),
    }),
  });
}

function collectStatuses(value, output = []) {
  if (!value || typeof value !== 'object') return output;
  if (VALID_STATUS.has(value.status)) output.push(value.status);
  for (const child of Object.values(value)) collectStatuses(child, output);
  return output;
}

export function passportCoverage(passport) {
  const statuses = collectStatuses(passport, []);
  const total = statuses.length;
  const verified = statuses.filter(status => status === PASSPORT_STATUS.VERIFIED).length;
  const configured = statuses.filter(status => status === PASSPORT_STATUS.CONFIGURED).length;
  const needsEvidence = statuses.filter(status => status === PASSPORT_STATUS.NEEDS_EVIDENCE).length;
  return Object.freeze({
    label: 'Bewijsdekking',
    total,
    verified,
    configured,
    needsEvidence,
    percentage: total ? Math.round((verified / total) * 100) : 0,
  });
}

function stripInternal(value) {
  if (Array.isArray(value)) return value.map(stripInternal);
  if (!value || typeof value !== 'object') return value;
  const result = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === 'scenarioIds' || key === 'tenantId') continue;
    if (key === 'evidence') {
      result.evidence = Array.isArray(child)
        ? child.map(item => ({ type: item.type, source: item.source, checkedAt: item.checkedAt }))
        : [];
      continue;
    }
    result[key] = stripInternal(child);
  }
  return result;
}

export function publicPassportView(passport) {
  return Object.freeze(stripInternal(passport));
}
