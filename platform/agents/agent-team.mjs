import { compileChatLearningPreflight } from '../../scripts/brain/chat-learning-preflight.mjs';
import { createAgentFabric } from './agent-fabric.mjs';
import { createAgentRegistry } from './agent-registry.mjs';

const sharedLearning = Object.freeze(['outcome.v1','pattern.v1']);

export const DEFAULT_AGENT_TEAM = Object.freeze([
  Object.freeze({
    id:'agent-reliability',
    domains:['Reliability','Operations'],
    capabilities:['analyze','diagnose','recover','verify'],
    tasks:['detect-runtime-failure','diagnose-root-cause','execute-safe-recovery','verify-recovery'],
    playbooks:['self-heal-safe-failure','retry-fallback-last-known-good','production-regression-recovery'],
    learningContracts:[...sharedLearning,'reliability.v1'],
  }),
  Object.freeze({
    id:'agent-security',
    domains:['Security','Trust'],
    capabilities:['analyze','audit','harden','verify'],
    tasks:['audit-security-controls','classify-security-gap','apply-safe-hardening','verify-least-privilege'],
    playbooks:['least-privilege-hardening','security-regression-response','secret-exposure-containment'],
    learningContracts:[...sharedLearning,'security.v1'],
  }),
  Object.freeze({
    id:'agent-cost',
    domains:['Cost','Operations'],
    capabilities:['analyze','optimize','measure','verify'],
    tasks:['measure-cost-baseline','identify-cost-waste','apply-bounded-cost-optimization','verify-cost-per-outcome'],
    playbooks:['daily-cost-reduction','batch-and-deduplicate','budget-envelope-guard'],
    learningContracts:[...sharedLearning,'cost.v1'],
  }),
  Object.freeze({
    id:'agent-performance',
    domains:['Performance','Website','Operations'],
    capabilities:['analyze','optimize','measure','verify'],
    tasks:['measure-runtime-performance','detect-performance-regression','optimize-critical-path','verify-latency-and-memory'],
    playbooks:['cached-state-first','memory-leak-recovery','critical-path-optimization'],
    learningContracts:[...sharedLearning,'performance.v1'],
  }),
  Object.freeze({
    id:'agent-data-quality',
    domains:['Data','Data Quality'],
    capabilities:['analyze','reconcile','validate','verify'],
    tasks:['validate-data-contract','reconcile-source-projection','detect-data-drift','verify-data-lineage'],
    playbooks:['source-projection-reconciliation','schema-drift-recovery','data-quality-regression'],
    learningContracts:[...sharedLearning,'data-quality.v1'],
  }),
  Object.freeze({
    id:'agent-website-ux',
    domains:['Website','UX'],
    capabilities:['analyze','design','optimize','verify'],
    tasks:['analyze-user-flow','design-bounded-improvement','implement-ux-change','verify-responsive-behavior'],
    playbooks:['ux-regression-recovery','conversion-friction-reduction','responsive-interface-verification'],
    learningContracts:[...sharedLearning,'ux.v1'],
  }),
  Object.freeze({
    id:'agent-seo-content',
    domains:['Website','SEO','Content'],
    capabilities:['analyze','optimize','create','verify'],
    tasks:['audit-search-demand','identify-content-gap','optimize-content','verify-search-outcome'],
    playbooks:['seo-regression-recovery','content-opportunity','search-intent-optimization'],
    learningContracts:[...sharedLearning,'seo.v1','content.v1'],
  }),
  Object.freeze({
    id:'agent-growth-market',
    domains:['Growth','Market','Commercial'],
    capabilities:['analyze','research','experiment','measure'],
    tasks:['detect-market-signal','size-opportunity','design-growth-experiment','measure-commercial-outcome'],
    playbooks:['market-opportunity-triage','growth-experiment-loop','commercial-signal-validation'],
    learningContracts:[...sharedLearning,'growth.v1','market.v1'],
  }),
  Object.freeze({
    id:'agent-integration-make',
    domains:['Integration','Make','Automation'],
    capabilities:['analyze','integrate','recover','optimize'],
    tasks:['validate-integration-contract','diagnose-scenario-failure','repair-safe-mapping','optimize-automation-cost'],
    playbooks:['make-runtime-recovery','mapping-contract-repair','idempotent-integration-delivery'],
    learningContracts:[...sharedLearning,'integration.v1','make.v1'],
  }),
  Object.freeze({
    id:'agent-governance-ai-act',
    domains:['Governance','AI Act','Trust'],
    capabilities:['analyze','audit','govern','verify'],
    tasks:['classify-governance-requirement','audit-ai-control','maintain-evidence-lineage','verify-policy-compliance'],
    playbooks:['ai-governance-gate','evidence-provenance-audit','hard-boundary-escalation'],
    learningContracts:[...sharedLearning,'governance.v1'],
  }),
  Object.freeze({
    id:'agent-product-opportunity',
    domains:['Product','Opportunity','Strategy'],
    capabilities:['analyze','prioritize','experiment','measure'],
    tasks:['detect-product-opportunity','prioritize-expected-value','design-bounded-experiment','measure-product-impact'],
    playbooks:['opportunity-to-mission','expected-utility-prioritization','product-experiment-loop'],
    learningContracts:[...sharedLearning,'product.v1','opportunity.v1'],
  }),
]);

export function createDefaultAgentRegistry() {
  return createAgentRegistry(DEFAULT_AGENT_TEAM);
}

export function createDefaultAgentFabric(options = {}) {
  const registry = options.registry ?? createDefaultAgentRegistry();
  const learningPreflight = options.learningPreflight ?? (() => compileChatLearningPreflight());
  return createAgentFabric({ ...options, registry, learningPreflight });
}
