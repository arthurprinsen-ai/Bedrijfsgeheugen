const WEIGHTS = Object.freeze({ answered: 0.20, measure: 0.25, evidence: 0.25, reviewed: 0.20, approved: 0.10 });
const SEVERITY_ORDER = Object.freeze({ critical: 4, high: 3, medium: 2, low: 1 });
const DEFAULT_NEXT = 'Vul het ontbrekende onderdeel aan en voeg controleerbaar bewijs toe.';
const DEFAULT_WHY = 'Zonder aantoonbare invulling, maatregel, bewijs en review kan dit onderdeel niet audit-ready worden verklaard.';

const pct = value => Math.round(Math.max(0, Math.min(1, value)) * 100);
const isTrue = value => value === true;
const normalizeSeverity = value => SEVERITY_ORDER[value] ? value : 'medium';

function validNotApplicable(control) {
  return control.applicable === false && Boolean(control.naReason?.trim()) && Boolean(control.naDecidedBy?.trim()) && Boolean(control.naDecidedAt?.trim());
}

function findingFor(control, code) {
  return {
    id: control.id,
    framework: control.framework || 'Onbekend',
    code,
    severity: normalizeSeverity(control.severity),
    title: control.title || control.id,
    why: control.why || DEFAULT_WHY,
    nextStep: control.nextStep || DEFAULT_NEXT,
    evidenceNeeded: control.evidenceNeeded || 'Controleerbaar bewijsstuk of reviewregistratie',
    owner: control.owner || 'Nog toe te wijzen',
    dueDate: control.dueDate || null
  };
}

export function assessCompliance(controls = []) {
  if (!Array.isArray(controls)) throw new TypeError('controls must be an array');
  if (controls.length === 0) return { completion:0, measures:0, evidence:0, review:0, approval:0, readiness:0, findings:[], byFramework:{} };

  const findings = [];
  const scored = [];
  const frameworkBuckets = new Map();

  for (const control of controls) {
    const framework = control.framework || 'Onbekend';
    if (!frameworkBuckets.has(framework)) frameworkBuckets.set(framework, []);

    if (control.applicable === false) {
      if (validNotApplicable(control)) {
        const row = { completion:1, measures:1, evidence:1, review:1, approval:1, readiness:1, excluded:true };
        scored.push(row);
        frameworkBuckets.get(framework).push(row);
      } else {
        const row = { completion:0, measures:0, evidence:0, review:0, approval:0, readiness:0 };
        scored.push(row);
        frameworkBuckets.get(framework).push(row);
        findings.push(findingFor(control, 'INVALID_NOT_APPLICABLE'));
      }
      continue;
    }

    const row = {
      completion: isTrue(control.answered) ? 1 : 0,
      measures: isTrue(control.measure) ? 1 : 0,
      evidence: isTrue(control.evidence) ? 1 : 0,
      review: isTrue(control.reviewed) ? 1 : 0,
      approval: isTrue(control.approved) ? 1 : 0
    };
    row.readiness = row.completion * WEIGHTS.answered + row.measures * WEIGHTS.measure + row.evidence * WEIGHTS.evidence + row.review * WEIGHTS.reviewed + row.approval * WEIGHTS.approved;
    scored.push(row);
    frameworkBuckets.get(framework).push(row);

    if (row.readiness < 1) {
      const code = !row.completion ? 'MISSING_ANSWER' : !row.measures ? 'MISSING_MEASURE' : !row.evidence ? 'MISSING_EVIDENCE' : !row.review ? 'MISSING_REVIEW' : 'MISSING_APPROVAL';
      findings.push(findingFor(control, code));
    }
  }

  const avg = key => pct(scored.reduce((sum, row) => sum + row[key], 0) / scored.length);
  const byFramework = {};
  for (const [framework, rows] of frameworkBuckets.entries()) {
    byFramework[framework] = {
      readiness: pct(rows.reduce((sum, row) => sum + row.readiness, 0) / rows.length),
      controls: rows.length,
      openRisks: findings.filter(item => item.framework === framework).length
    };
  }

  findings.sort((a,b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] || a.framework.localeCompare(b.framework));
  return { completion:avg('completion'), measures:avg('measures'), evidence:avg('evidence'), review:avg('review'), approval:avg('approval'), readiness:avg('readiness'), findings, byFramework };
}

function hashText(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
}

export function buildAuditSnapshot({ organisation='Organisatie', generatedAt=new Date().toISOString(), frameworkVersions={}, scope='Compliance & governance', assessment }) {
  if (!assessment) throw new TypeError('assessment is required');
  const day = generatedAt.slice(0,10).replaceAll('-', '');
  const signature = hashText(JSON.stringify({ organisation, generatedAt, frameworkVersions, scope, assessment }));
  return {
    snapshotId: `AUD-${day}-${signature}`,
    generatedAt,
    organisation,
    scope,
    frameworkVersions:{ ...frameworkVersions },
    readiness:assessment.readiness,
    metrics:{ completion:assessment.completion, measures:assessment.measures, evidence:assessment.evidence, review:assessment.review, approval:assessment.approval },
    byFramework:assessment.byFramework,
    openRisks:assessment.findings.map(item => ({ ...item })),
    nextActions:[...new Set(assessment.findings.map(item => item.nextStep).filter(Boolean))]
  };
}

export function loadComplianceControls(storage = globalThis.localStorage) {
  const candidates = ['bg.compliance.controls.v1', 'bg_compliance_controls_v1', 'bgComplianceControls'];
  for (const key of candidates) {
    try {
      const parsed = JSON.parse(storage?.getItem?.(key) || 'null');
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.controls)) return parsed.controls;
    } catch { /* malformed legacy state is ignored, never treated as compliant */ }
  }
  return Array.isArray(globalThis.__BG_COMPLIANCE_CONTROLS__) ? globalThis.__BG_COMPLIANCE_CONTROLS__ : [];
}
