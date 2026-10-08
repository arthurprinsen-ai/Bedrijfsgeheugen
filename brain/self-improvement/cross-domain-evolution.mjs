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
    isFresh(comparison,timestamp,maxAgeMs);

  const evaluation = evaluatePromotionCandidate({ baseline, candidate });
  let decision = 'GATHER_VERIFIED_OUTCOMES';
  if (missingReviews.length) decision = 'REVIEW_REQUIRED';
  else if (missingDomains.length) decision = 'GATHER_VERIFIED_OUTCOMES';
  else if (!comparisonVerified) decision = 'COUNTERFACTUAL_REQUIRED';
  else if (evaluation.decision === 'REJECT') decision = 'REJECT';
  else if (!evaluation.promotable) decision = 'EVALUATION_REQUIRED';
  else decision = 'PROPOSE_PROTECTED_DELIVERY';

  const nextKind = {
    REVIEW_REQUIRED:'cross_domain_review',
    GATHER_VERIFIED_OUTCOMES:'outcome_measurement',
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
  const realizedRevenueEur = outcomes.some(x => x.domain === 'business' &&
      x.metric === 'realized_revenue_eur' && Number.isFinite(x.value))
    ? outcomes.filter(x => x.domain === 'business' && x.metric === 'realized_revenue_eur' &&
        Number.isFinite(x.value)).reduce((sum,x) => sum + x.value,0)
    : null;

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
      realizedRevenueEur,
      status:decision === 'PROPOSE_PROTECTED_DELIVERY'
        ? 'EVIDENCE_BACKED_PROMOTION_CANDIDATE' : 'NOT_YET_PROMOTABLE',
      compiledLearning
    },
    evaluation,
    explanation:'Incremental impact and next safe action only. Canonical execution, provider readback and protected release are separate authorities.'
  });
}
