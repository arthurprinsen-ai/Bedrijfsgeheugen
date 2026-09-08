const STATUS = Object.freeze({
  NOT_ASSESSED: 'NOT_ASSESSED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  UNKNOWN: 'UNKNOWN',
  MISSING: 'MISSING',
  IN_PROGRESS: 'IN_PROGRESS',
  EVIDENCE_MISSING: 'EVIDENCE_MISSING',
  VERIFIED: 'VERIFIED'
});

const LEGACY_FRAMEWORKS = new Set(['NIS', 'WBNI']);
const SEVERITY_WEIGHT = Object.freeze({ critical: 400, high: 300, medium: 200, low: 100, info: 0 });
const STATUS_WEIGHT = Object.freeze({
  MISSING: 70,
  UNKNOWN: 55,
  EVIDENCE_MISSING: 40,
  IN_PROGRESS: 25,
  NOT_ASSESSED: 20,
  VERIFIED: 0,
  NOT_APPLICABLE: -100
});

export function canonicalFramework(framework = '') {
  const value = String(framework || '').trim().toUpperCase();
  if (LEGACY_FRAMEWORKS.has(value) || value === 'NIS2' || value === 'CBW' || value === 'CYBERBEVEILIGINGSWET') return 'NIS2_CBW';
  return value || 'UNKNOWN_FRAMEWORK';
}

function validDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function evidenceIsCurrent(item, now) {
  if (!item || item.verified === false) return false;
  const validUntil = validDate(item.validUntil);
  if (validUntil && validUntil < now) return false;
  return true;
}

function controlImplemented(control) {
  if (!control) return false;
  if (typeof control === 'boolean') return control;
  if (typeof control === 'object' && 'implemented' in control) return control.implemented === true;
  return true;
}

export function evaluateControl(control = {}, { now = new Date() } = {}) {
  const evaluated = { ...control, framework: canonicalFramework(control.framework) };
  const applicability = String(control.applicability || 'unknown').toLowerCase();

  if (applicability === 'not_applicable' || applicability === 'not-applicable' || applicability === 'n/a') {
    return { ...evaluated, status: STATUS.NOT_APPLICABLE };
  }
  if (applicability !== 'applicable') {
    return { ...evaluated, status: STATUS.UNKNOWN };
  }
  if (control.status === STATUS.IN_PROGRESS) {
    return { ...evaluated, status: STATUS.IN_PROGRESS };
  }
  if (!controlImplemented(control.control)) {
    return { ...evaluated, status: STATUS.MISSING };
  }

  const verifiedAt = validDate(control.verifiedAt);
  const evidence = Array.isArray(control.evidence) ? control.evidence : [];
  const hasCurrentEvidence = evidence.some(item => evidenceIsCurrent(item, now));
  if (!verifiedAt || verifiedAt > now || !hasCurrentEvidence) {
    return { ...evaluated, status: STATUS.EVIDENCE_MISSING };
  }

  return { ...evaluated, status: STATUS.VERIFIED };
}

function dedupeControls(controls, now) {
  const byKey = new Map();
  for (const raw of controls || []) {
    const evaluated = evaluateControl(raw, { now });
    const key = `${evaluated.framework}:${evaluated.id || evaluated.requirement || ''}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, evaluated);
      continue;
    }
    const existingPriority = (SEVERITY_WEIGHT[existing.severity] || 0) + (STATUS_WEIGHT[existing.status] || 0);
    const newPriority = (SEVERITY_WEIGHT[evaluated.severity] || 0) + (STATUS_WEIGHT[evaluated.status] || 0);
    if (newPriority > existingPriority) byKey.set(key, evaluated);
  }
  return [...byKey.values()];
}

function frameworkSummary(controls) {
  const frameworks = {};
  for (const control of controls) {
    const name = control.framework;
    const bucket = frameworks[name] ||= { total: 0, verified: 0, missing: 0, unknown: 0, evidenceMissing: 0, inProgress: 0, notApplicable: 0 };
    bucket.total += 1;
    if (control.status === STATUS.VERIFIED) bucket.verified += 1;
    else if (control.status === STATUS.MISSING) bucket.missing += 1;
    else if (control.status === STATUS.UNKNOWN || control.status === STATUS.NOT_ASSESSED) bucket.unknown += 1;
    else if (control.status === STATUS.EVIDENCE_MISSING) bucket.evidenceMissing += 1;
    else if (control.status === STATUS.IN_PROGRESS) bucket.inProgress += 1;
    else if (control.status === STATUS.NOT_APPLICABLE) bucket.notApplicable += 1;
  }
  for (const bucket of Object.values(frameworks)) {
    const assessed = bucket.total - bucket.notApplicable - bucket.unknown;
    bucket.assessed = assessed;
    bucket.coverage = assessed > 0 ? Math.round((bucket.verified / assessed) * 100) : null;
  }
  return frameworks;
}

export function evaluatePortfolio(controls = [], { now = new Date(), scope = 'customer' } = {}) {
  const evaluated = dedupeControls(controls, now);
  const frameworks = frameworkSummary(evaluated);
  const unknown = evaluated.filter(item => item.status === STATUS.UNKNOWN || item.status === STATUS.NOT_ASSESSED).length;
  const applicable = evaluated.filter(item => ![STATUS.NOT_APPLICABLE, STATUS.UNKNOWN, STATUS.NOT_ASSESSED].includes(item.status));
  const verified = applicable.filter(item => item.status === STATUS.VERIFIED).length;
  return {
    scope,
    controls: evaluated,
    frameworks,
    total: evaluated.length,
    unknown,
    applicable: applicable.length,
    verified,
    coverage: applicable.length ? Math.round((verified / applicable.length) * 100) : null
  };
}

export function rankRisks(controls = [], { now = new Date() } = {}) {
  return dedupeControls(controls, now)
    .filter(item => ![STATUS.VERIFIED, STATUS.NOT_APPLICABLE].includes(item.status))
    .map(item => {
      const linkedRequirements = Array.isArray(item.linkedRequirements) ? item.linkedRequirements.length : 0;
      const dependencyWeight = Array.isArray(item.dependencies) ? item.dependencies.length * 4 : 0;
      const score = (SEVERITY_WEIGHT[item.severity] || SEVERITY_WEIGHT.medium) + (STATUS_WEIGHT[item.status] || 0) + Math.min(linkedRequirements * 3, 30) + dependencyWeight;
      return { ...item, riskScore: score };
    })
    .sort((a, b) => b.riskScore - a.riskScore || String(a.id).localeCompare(String(b.id)));
}

export function createAuditSnapshot(controls = [], { now = new Date(), scope = 'customer', audience = 'audit' } = {}) {
  const portfolio = evaluatePortfolio(controls, { now, scope });
  const findings = rankRisks(portfolio.controls, { now }).map(item => ({
    id: item.id,
    framework: item.framework,
    requirement: item.requirement,
    status: item.status,
    severity: item.severity,
    owner: item.owner || null,
    reason: item.reason || null,
    nextAction: item.nextAction || null,
    riskScore: item.riskScore
  }));
  const evidenceIndex = portfolio.controls.flatMap(control => (Array.isArray(control.evidence) ? control.evidence : []).map(evidence => ({
    controlId: control.id,
    framework: control.framework,
    evidenceId: evidence.id || null,
    label: evidence.label || evidence.type || 'Evidence',
    source: evidence.source || evidence.href || null,
    validUntil: evidence.validUntil || null
  })));
  return {
    scope,
    audience,
    timestamp: now.toISOString(),
    frameworks: portfolio.frameworks,
    summary: { total: portfolio.total, applicable: portfolio.applicable, verified: portfolio.verified, unknown: portfolio.unknown, coverage: portfolio.coverage },
    findings,
    evidenceIndex
  };
}

export { STATUS as COMPLIANCE_STATUS };
