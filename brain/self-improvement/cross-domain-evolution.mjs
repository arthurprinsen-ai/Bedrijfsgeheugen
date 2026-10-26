import { createHash } from 'node:crypto';
import { deriveOrganismEffects } from '../../platform/organism/organism-graph.mjs';
import { evaluatePromotionCandidate, compileLearning } from './self-improvement-layer.mjs';

const unique = values => [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))].sort();
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const seal = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) seal(item);
    Object.freeze(value);
  }
  return value;
};
const validDate = value => Number.isFinite(Date.parse(value || ''));
const refs = value => unique(value?.evidenceRefs ?? value?.evidence_refs ?? []);
const isFresh = (record, now, maxAgeMs) =>
  validDate(record?.observedAt) && Date.parse(record.observedAt) <= now &&
  now - Date.parse(record.observedAt) <= maxAgeMs;

// An action/transport outcome is not financial value, even if a legacy
// observation has truth_class=realized. The immutable raw evidence is retained;
// only this derived decision policy excludes unexecuted/vanity observations.
const nonFinancialUnits = new Set([
  'not_executed','execution_completed','sent','no_response',
  'no_reply_observed','reply_received','reply_objection','queued','delivered'
]);
const financialProofKinds = {
  realized_revenue_eur:new Set(['SETTLED_PAYMENT','RECONCILED_ACCOUNTING']),
  realized_cost_saving_eur:new Set(['RECONCILED_ACCOUNTING','VERIFIED_COST_SAVING'])
};
function hasVerifiedFinancialValue(item, now, maxAgeMs) {
  const proof = item?.valueEvidence;
  return item?.domain === 'business' &&
    item?.truthClass === 'realized' &&
    item?.currency === 'EUR' &&
    Number.isFinite(item?.value) && item.value >= 0 &&
    !nonFinancialUnits.has(String(item?.unit || '').toLowerCase()) &&
    financialProofKinds[item?.metric]?.has(proof?.kind) === true &&
    proof?.verified === true &&
    proof?.tenantId === item.tenantId &&
    proof?.sourceRevision === item.sourceRevision &&
    typeof proof?.recordId === 'string' && proof.recordId.trim().length > 0 &&
    typeof proof?.providerReadbackId === 'string' && proof.providerReadbackId.trim().length > 0 &&
    refs(proof).length > 0 && isFresh(proof, now, maxAgeMs);
}

/**
 * Pure, tenant-scoped policy planner. No network, database writes, provider dispatch,
 * synthetic impact claims or alternative delivery owner. The canonical runtime can
 * consume its obligations; their existence does not mean they were executed.
 */
export function planCrossDomainEvolution({
  change, baseline = {}, candidate = {}, observations = [],
  reviews = [], comparison = {}, now = new Date().toISOString(),
  maxEvidenceAgeDays = 90
} = {}) {
  if (!change?.id || !change?.tenantId || !change?.sourceRevision ||
      !change?.baselinePolicyVersion || !change?.candidatePolicyVersion)
    throw new TypeError('change requires id, tenantId, sourceRevision and both policy versions');
  if (!validDate(now) || !Number.isInteger(maxEvidenceAgeDays) ||
      maxEvidenceAgeDays < 1 || maxEvidenceAgeDays > 365)
    throw new TypeError('valid time and bounded evidence freshness required');

  const timestamp = Date.parse(now);
  const maxAgeMs = maxEvidenceAgeDays * 86400000;
  const revision = String(change.sourceRevision);
  const identity = {
    tenantId: String(change.tenantId), changeId: String(change.id),
    sourceRevision: revision,
    baselinePolicyVersion: String(change.baselinePolicyVersion),
    candidatePolicyVersion: String(change.candidatePolicyVersion)
  };
  const fingerprint = 'POWERHOUSE-EVOLUTION-' + digest(identity).slice(0,24);
  const effects = deriveOrganismEffects({
    inputType: change.inputType || 'PortalDomainStateSnapshot',
    modelId: change.modelId || (change.kind === 'ai_model' ? 'ai_model' : ''),
    statePath: change.statePath || change.kind || ''
  });
  const affected = new Set(effects.recomputeDomains);
  const requiredReviews = unique([
    'SECURITY',
    ...(affected.has('compliance.gdpr') ? ['GDPR'] : []),
    ...(affected.has('compliance.eu_ai_act') ? ['EU_AI_ACT'] : []),
    ...(affected.has('compliance.nis2_cbw') ? ['NIS2_CBW'] : []),
    ...(['suppliers','finance','data.inventory'].some(node => affected.has(node)) ? ['CSRD_ESRS_APPLICABILITY'] : [])
  ]);
  const scopeMatches = record => record?.tenantId === identity.tenantId &&
    record?.changeId === identity.changeId && record?.sourceRevision === revision;
  const approvedReviews = requiredReviews.filter(control => reviews.some(review =>
    scopeMatches(review) && review.control === control &&
    ['APPROVED','NOT_APPLICABLE'].includes(review.status) &&
    review.verified === true && isFresh(review,timestamp,maxAgeMs) &&
    refs(review).length > 0 &&
    (review.status !== 'NOT_APPLICABLE' || String(review.rationale || '').trim().length > 0)
  ));
  const missingReviews = requiredReviews.filter(control => !approvedReviews.includes(control));

  // A delivery acknowledgement is not a business outcome. Only verified,
  // non-synthetic facts with independent provider/production readback may teach.
  const verifiedObservations = observations.filter(item =>
    scopeMatches(item) && item.verified === true &&
    item.synthetic !== true && item.testEvent !== true &&
    ['business','engineering'].includes(item.domain) &&
    Boolean(item.actionId) && Boolean(item.outcomeId) &&
    refs(item).length > 0 && isFresh(item,timestamp,maxAgeMs) &&
    (Boolean(item.providerReceiptId) || Boolean(item.productionReadbackId))
  );
  const byOutcome = new Map();
  for (const item of verifiedObservations)
    if (!byOutcome.has(item.outcomeId)) byOutcome.set(item.outcomeId,item);
  const outcomes = [...byOutcome.values()];
  const coveredDomains = unique(outcomes.map(item => item.domain));
  const missingDomains = ['business','engineering'].filter(d => !coveredDomains.includes(d));
  const engineeringOutcomeIds = new Set(outcomes.filter(item => item.domain === 'engineering').map(item => item.outcomeId));
  const financialValueByProof = new Map();
  for (const item of outcomes) {
    if (!hasVerifiedFinancialValue(item, timestamp, maxAgeMs) ||
        !engineeringOutcomeIds.has(item.linkedEngineeringOutcomeId)) continue;
    // One independent financial source is counted once, even if multiple action
    // and sales events refer to the same settlement/accounting record.
    const key = item.valueEvidence.kind + ':' + item.valueEvidence.recordId;
    if (!financialValueByProof.has(key)) financialValueByProof.set(key, item);
  }
  const verifiedFinancialValues = [...financialValueByProof.values()];
  const verifiedValueIds = new Set(verifiedFinancialValues.map(item => item.outcomeId));

  // Causal uplift is never inferred from clicks, action counts, transport ACKs,
  // historical correlation or merely populated baseline/candidate fields.
  const comparisonVerified = comparison?.verified === true &&
    comparison.tenantId === identity.tenantId &&
    comparison.changeId === identity.changeId &&
    comparison.sourceRevision === revision &&
    comparison.baselinePolicyVersion === identity.baselinePolicyVersion &&
    comparison.candidatePolicyVersion === identity.candidatePolicyVersion &&
    Boolean(comparison.experimentId) &&
    comparison.hasControlGroup === true && refs(comparison).length > 0 &&
    Boolean(comparison.assignmentReadbackId) &&
    Array.isArray(comparison.linkedBusinessOutcomeIds) &&
    Array.isArray(comparison.linkedEngineeringOutcomeIds) &&
    comparison.linkedBusinessOutcomeIds.some(id => verifiedValueIds.has(id)) &&
    comparison.linkedEngineeringOutcomeIds.some(id => engineeringOutcomeIds.has(id)) &&
    isFresh(comparison,timestamp,maxAgeMs);

  const evaluation = evaluatePromotionCandidate({ baseline, candidate });
  let decision = 'GATHER_VERIFIED_OUTCOMES';
  if (missingReviews.length) decision = 'REVIEW_REQUIRED';
  else if (missingDomains.length) decision = 'GATHER_VERIFIED_OUTCOMES';
  else if (!verifiedFinancialValues.length) decision = 'BUSINESS_VALUE_EVIDENCE_REQUIRED';
  else if (!comparisonVerified) decision = 'COUNTERFACTUAL_REQUIRED';
  else if (evaluation.decision === 'REJECT') decision = 'REJECT';
  else if (!evaluation.promotable) decision = 'EVALUATION_REQUIRED';
  else decision = 'PROPOSE_PROTECTED_DELIVERY';

  const nextKind = {
    REVIEW_REQUIRED:'cross_domain_review',
    GATHER_VERIFIED_OUTCOMES:'outcome_measurement',
    BUSINESS_VALUE_EVIDENCE_REQUIRED:'financial_value_verification',
    COUNTERFACTUAL_REQUIRED:'controlled_experiment',
    REJECT:'regression_prevention',
    EVALUATION_REQUIRED:'candidate_evaluation',
    PROPOSE_PROTECTED_DELIVERY:'protected_delivery_candidate'
  }[decision];

  const compiledLearning = decision === 'PROPOSE_PROTECTED_DELIVERY'
    ? compileLearning({
      source: {
        id:fingerprint, fingerprint, material:true, verified:true,
        regressionProven:candidate?.gates?.regression === true,
        topologyChanged:change.topologyChanged === true
      },
      evaluation
    })
    : null;
  const sumVerified = metric => {
    const entries = verifiedFinancialValues.filter(item => item.metric === metric);
    return entries.length ? entries.reduce((sum, item) => sum + item.value, 0) : null;
  };
  const realizedRevenueEur = sumVerified('realized_revenue_eur');
  const realizedCostSavingsEur = sumVerified('realized_cost_saving_eur');

  return seal({
    schemaVersion:'powerhouse-cross-domain-evolution.v1',
    fingerprint,
    identity,
    decision,
    nextAction: {
      id:fingerprint + ':' + nextKind,
      kind:nextKind,
      status:'PROPOSED_NOT_EXECUTED',
      authority:decision === 'PROPOSE_PROTECTED_DELIVERY'
        ? 'existing_protected_delivery' : 'canonical_brain_obligations',
      directProviderMutation:false,
      directProductionMutation:false
    },
    impact: {
      graphVersion:effects.version,
      affectedDomains:unique(effects.recomputeDomains),
      requiredReviews, approvedReviews, missingReviews,
      csrdApplicability:'REQUIRES_EVIDENCE_NOT_INFERRED'
    },
    learning: {
      verifiedOutcomeCount:outcomes.length,
      coveredDomains, missingDomains,
      comparisonVerified,
      verifiedFinancialValueCount:verifiedFinancialValues.length,
      financialValueStatus:verifiedFinancialValues.length ? 'FINANCIAL_PROOF_LINKED' : 'NOT_PROVEN',
      realizedRevenueEur,
      realizedCostSavingsEur,
      status:decision === 'PROPOSE_PROTECTED_DELIVERY'
        ? 'EVIDENCE_BACKED_PROMOTION_CANDIDATE' : 'NOT_YET_PROMOTABLE',
      compiledLearning
    },
    evaluation,
    explanation:'Incremental impact and next safe action only. Canonical execution, provider readback and protected release are separate authorities.'
  });
}
