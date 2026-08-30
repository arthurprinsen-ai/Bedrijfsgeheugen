import { readFileSync } from 'node:fs';

const contract = JSON.parse(
  readFileSync(new URL('../config/make-scenario-admission-contract.json', import.meta.url), 'utf8')
);

const nonEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (typeof value === 'boolean') return true;
  return false;
};

const looksGenericSharedSource = (candidate) => {
  const source = String(candidate.authoritative_source || '').toLowerCase();
  return source.includes('datahub') || source.includes('shared') || source.includes('generic');
};

export function validateMakeScenarioAdmission(candidate = {}) {
  const missing = contract.required_fields.filter((field) => !nonEmpty(candidate[field]));
  const violations = [];

  if (looksGenericSharedSource(candidate) && !nonEmpty(candidate.domain_eligibility)) {
    violations.push({
      rule: 'DOMAIN_ELIGIBILITY_BEFORE_GENERIC_DATAHUB_CONSUMPTION',
      message: 'Generic/shared source requires explicit positive and negative domain eligibility before production promotion.',
    });
  }

  if (!nonEmpty(candidate.stable_identity_or_dedupe_key)) {
    violations.push({
      rule: 'DEDUPE_BEFORE_EXPENSIVE_WORK',
      message: 'Stable identity/dedupe key is missing.',
    });
  }

  if (!nonEmpty(candidate.max_batch_or_bounded_window)) {
    violations.push({
      rule: 'BOUNDED_SOURCE_READ',
      message: 'A hard batch/window bound is required.',
    });
  }

  if (!nonEmpty(candidate.cache_or_delta_strategy)) {
    violations.push({
      rule: 'PROJECT_CONSUMED_FIELDS',
      message: 'Cache/delta/projection strategy is missing.',
    });
  }

  if (!nonEmpty(candidate.ai_justification)) {
    violations.push({
      rule: 'AI_ONLY_FOR_MATERIAL_UNCERTAINTY',
      message: 'AI justification must state the remaining uncertainty or explicitly state that the path is deterministic/no-AI.',
    });
  }

  if (!nonEmpty(candidate.rollback_identity_or_plan)) {
    violations.push({
      rule: 'SHADOW_BEFORE_SOURCE_TRIGGER_CUTOVER',
      message: 'Rollback identity/plan is required before promotion.',
    });
  }

  if (!nonEmpty(candidate.learning_writeback)) {
    violations.push({
      rule: 'LEARNING_FABRIC_REQUIRED',
      message: 'Shared learning writeback is required.',
    });
  }

  if (!nonEmpty(candidate.protected_metrics)) {
    violations.push({
      rule: 'PROTECTED_METRIC_REGRESSION_LIMIT',
      message: 'Protected metrics must be declared before promotion.',
    });
  }

  const uniqueViolations = [...new Map(violations.map((v) => [v.rule, v])).values()];
  const ok = missing.length === 0 && uniqueViolations.length === 0;

  return {
    contract_id: contract.contract_id,
    ok,
    decision: ok ? 'ADMISSION_PASS' : 'BLOCK_PROMOTION',
    missing,
    violations: uniqueViolations,
  };
}

export function admissionContract() {
  return contract;
}
