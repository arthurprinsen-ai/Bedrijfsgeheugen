import { validateLearningEvent } from '../../scripts/team-memory/validate-event.mjs';

const MATERIAL_TYPES = new Set(['ERROR','RECOVERY','IMPROVEMENT','OPPORTUNITY','EXPERIMENT_RESULT','CONTRACT_CHANGE','PRODUCTION_PROMOTION','PRODUCTION_ROLLBACK']);

function normalize(values) {
  return [...new Set((values ?? []).map(value => String(value).trim()).filter(Boolean))].sort();
}

function intersects(left, right) {
  const target = new Set(right);
  return left.some(value => target.has(value));
}

function verified(value) {
  return /green|verified|resolved|passed|completed/i.test(String(value ?? ''));
}

export function createTeamMemoryBridge() {
  function toMaterialOutcome(input) {
    if (!MATERIAL_TYPES.has(input?.outcomeType)) throw new TypeError('unsupported material outcome type');
    if (!input?.tenantId) throw new TypeError('tenantId is required');
    if (!input?.work?.primaryAgentId || !input?.meta?.fingerprint) throw new TypeError('work owner and fingerprint are required');

    const event = {
      type:input.outcomeType,
      source:'agent-fabric',
      component:'shared-agent-fabric',
      fingerprint:String(input.meta.fingerprint),
      severity:input.severity ?? (input.outcomeType === 'ERROR' ? 'error' : 'info'),
      owner_agent:String(input.work.primaryAgentId),
      support_agents:normalize(input.work.supportAgentIds),
      tenant_id:String(input.tenantId),
      domains:normalize(input.meta.domains),
      work_id:String(input.work.id),
      status:String(input.work.status ?? ''),
      action:String(input.action ?? ''),
      verification:String(input.verification ?? ''),
      rollback:String(input.rollback ?? ''),
      evidence:normalize(input.evidence),
      metric:String(input.metric ?? ''),
      confidence:Number(input.confidence ?? 0),
      reusable_lesson:String(input.reusableLesson ?? '').slice(0,1500),
    };

    if (input.outcomeType === 'OPPORTUNITY') {
      event.evidence_score = Number(input.evidenceScore ?? 0);
      event.novelty_score = Number(input.noveltyScore ?? 0);
      event.business_impact_score = Number(input.businessImpactScore ?? 0);
    }

    const validation = validateLearningEvent(event);
    if (!validation.valid) throw new Error(`invalid shared-memory event: ${validation.errors.join('; ')}`);
    return Object.freeze(event);
  }

  function fromSharedContext({ tenantId, requesterDomains = [], records = [] } = {}) {
    if (!tenantId) throw new TypeError('tenantId is required');
    const domains = normalize(requesterDomains);
    return Object.freeze(records
      .filter(record => record && verified(record.verification))
      .filter(record => domains.length === 0 || intersects(normalize(record.domains), domains))
      .slice(0,20)
      .map(record => Object.freeze({
        kind:'VERIFIED_TEAM_LEARNING',
        tenantId,
        fingerprint:String(record.fingerprint ?? ''),
        domains:Object.freeze(normalize(record.domains)),
        lesson:String(record.lesson ?? record.reusable_lesson ?? '').slice(0,1500),
        verification:String(record.verification ?? '').slice(0,500),
        ownerAgentId:String(record.owner_agent ?? ''),
        evidence:Object.freeze(normalize(record.evidence).slice(0,20)),
      }))
      .filter(candidate => candidate.fingerprint && candidate.lesson));
  }

  return Object.freeze({ toMaterialOutcome, fromSharedContext });
}
