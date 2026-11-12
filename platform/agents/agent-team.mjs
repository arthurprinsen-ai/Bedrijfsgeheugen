import { createAgentRegistry } from './agent-registry.mjs';

const sharedLearning = Object.freeze(['outcome.v1','pattern.v1']);

export const DEFAULT_AGENT_TEAM = Object.freeze([
  Object.freeze({
    id:'agent-integration-engineer',
    domains:['Operations','Product','Website','Data'],
    capabilities:['analyze','integrate','verify','optimize'],
    tasks:['integrate-specialist-patches','resolve-safe-conflicts','assemble-single-candidate','verify-candidate-coherence'],
    playbooks:['one-writer-candidate-integration','late-bound-closure','critical-path-batching'],
    learningContracts:[...sharedLearning,'engineering.v1','delivery.v1'],
  }),
  Object.freeze({
    id:'agent-code-quality',
    domains:['Product','Website','Data','Operations'],
    capabilities:['analyze','audit','optimize','verify'],
    tasks:['detect-duplication','enforce-architecture-patterns','review-maintainability','verify-design-system-consistency','reject-website-all-green-from-visibility-only-sweeps'],
    playbooks:['reuse-before-create','quality-pass-before-candidate','hot-file-avoidance'],
    learningContracts:[...sharedLearning,'engineering.v1','quality.v1'],
  }),
  Object.freeze({
    id:'agent-reliability',
    domains:['Reliability','Operations'],
    capabilities:['analyze','diagnose','recover','verify'],
    tasks:['detect-runtime-failure','diagnose-root-cause','execute-safe-recovery','verify-recovery','read-canonical-15-loop-owner-and-action','reconcile-existing-brain-obligation-with-runtime-proof','reopen-source-fingerprint-on-regression','reconcile-stalled-portal-cro-handoff-with-original-owner','audit-all-active-original-loop-handoffs-without-aging-out','reconcile-unchanged-consumer-ack-under-original-owner-lease','require-independent-receipt-before-terminal-green','reconcile-explicit-concurrent-portal-flush-to-newest-authorized-revision-without-second-writer','reconcile-customer-process-intent-to-authorized-approval-and-outcome-in-original-deliveryplan-without-false-green','reconcile-website-portal-scans-pricing-external-data-to-original-powerhouse-heartbeat-ack-without-second-loop'],
    playbooks:['self-heal-safe-failure','retry-fallback-last-known-good','production-regression-recovery','same-owner-fingerprint-to-provider-readback','no-green-from-owner-assignment'],
    learningContracts:[...sharedLearning,'reliability.v1'],
  }),
  Object.freeze({
    id:'agent-security',
    domains:['Security','Trust','Website','Platform'],
    capabilities:['analyze','audit','harden','verify','reconcile'],
    tasks:['audit-security-controls','classify-security-gap','apply-safe-hardening','verify-least-privilege',
      'reconcile-github-branch-codeql-and-secret-scanning','reconcile-supabase-rls-rpc-and-advisors',
      'reconcile-netlify-preview-protection-and-secret-scan','verify-website-headers-auth-and-dependencies',
      'publish-expiring-security-evidence-to-canonical-trust-center','reopen-regressed-security-incident',
      'explain-tenant-security-evidence-in-entrepreneur-safety-compass','restrict-technical-security-findings-to-admin-view',
      'escalate-unsupported-provider-access-control-without-retry-loop',
      'trace-privileged-external-callers-before-grant-change',
      'verify-denied-anonymous-access-after-provider-protection',
      'verify-canonical-agent-registry-netlify-runtime-release-parity'],
    playbooks:['least-privilege-hardening','security-regression-response','secret-exposure-containment',
      'provider-readback-before-green','same-brain-incident-closed-loop','exclusive-writer-protected-release',
      'plain-language-security-confidence-without-safety-score','admin-only-sensitive-security-detail',
      'provider-configuration-owner-escalation','dependency-first-privileged-rpc-hardening',
      'negative-access-proof-before-resolved',
      'source-import-release-classifier-recovery'],
    learningContracts:[...sharedLearning,'security.v1','reliability.v1','delivery.v1'],
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
    tasks:['validate-data-contract','reconcile-source-projection','detect-data-drift','verify-data-lineage','validate-exact-assurance-owner-action-source-pair','verify-fresh-original-stage-and-provider-receipts','verify-exact-tenant-source-revision-consumer-ack','detect-provenance-or-source-freshness-gap-before-cro-action','audit-process-step-intents-and-missing-independent-consumer-receipts-per-tenant-revision','deny-unmatched-company-graph-causal-edges-and-unverified-outcome-value-in-customer-intelligence','reconcile-scan-store-to-runtime-event-to-growth-consumer-receipt-before-completion','exclude-source-identified-provider-smoke-from-original-cro-and-heartbeat-customer-learning','require-per-tenant-revision-source-to-consumer-ack-and-effect-receipts-for-all-customer-input-surfaces'],
    playbooks:['source-projection-reconciliation','schema-drift-recovery','data-quality-regression'],
    learningContracts:[...sharedLearning,'data-quality.v1'],
  }),
  Object.freeze({
    id:'agent-website-ux',
    domains:['Website','UX'],
    capabilities:['analyze','design','optimize','verify'],
    tasks:['analyze-user-flow','design-bounded-improvement','implement-ux-change','verify-responsive-behavior','verify-public-mobile-menu-viewport-geometry-and-single-toggle','verify-sitewide-sticky-header-and-cta-touch-contrast','confirm-real-mobile-browser-gate-and-exact-production-sha','inventory-sitewide-interactions-with-observed-outcomes','verify-wcag-aa-normal-text-contrast-in-real-browser','reconcile-unproven-route-selector-viewport-to-original-website-owner','verify-one-primary-portal-recovery-action-from-original-brain','verify-admin-and-tenant-protected-owner-readback','verify-dependent-portal-projections-from-acknowledged-revision','verify-calm-evidence-first-portal-home-and-keyboard-canonical-search-with-original-access-gates','verify-single-installable-portal-app-and-tablet-original-dock-with-current-readback','show-open-original-owner-stage-and-next-action-tenant-safely','verify-live-pricing-scan-external-connector-and-all-editable-portal-entrypoints-with-original-owner-readback'],
    playbooks:['ux-regression-recovery','conversion-friction-reduction','responsive-interface-verification','sitewide-functional-coverage-fail-closed-release'],
    learningContracts:[...sharedLearning,'ux.v1'],
  }),
  Object.freeze({
    id:'agent-seo-content',
    domains:['Website','SEO','Content'],
    capabilities:['analyze','optimize','create','verify'],
    tasks:['audit-search-demand','identify-content-gap','optimize-content','verify-search-outcome','route-evidence-backed-technical-seo-cro-fix-to-original-lease','verify-chatgpt-and-claude-search-crawler-access-and-public-product-truth','record-only-observed-ai-answer-citations-or-NOT_MEASURED','hand-off-ai-answer-intent-owner-and-conversion-evidence-to-original-SEO-Brain-Heartbeat-loop'],
    playbooks:['seo-regression-recovery','content-opportunity','search-intent-optimization'],
    learningContracts:[...sharedLearning,'seo.v1','content.v1'],
  }),
  Object.freeze({
    id:'agent-growth-market',
    domains:['Growth','Market','Commercial'],
    capabilities:['analyze','research','experiment','measure'],
    tasks:['detect-market-signal','size-opportunity','design-growth-experiment','measure-commercial-outcome','distinguish-source-green-from-executed-commercial-outcome','learn-from-provider-verified-conversion-or-honest-no-evidence','rank-source-verified-portal-cro-candidates','decide-one-safe-cro-experiment-with-original-lease','verify-cro-treatment-holdout-outcome-and-next-cycle-application','autonomously-rank-one-eligible-safe-reversible-cro-action','reject-unqualified-cro-variant-with-source-evidence-and-owner','confirm-next-natural-run-applied-proven-learning','inspect-real-nl-en-scan-pricing-cta-to-holdout-to-heartbeat-outcome-lineage','verify-three-choice-pricing-advisor-cta-reaches-original-cro-intent-without-double-navigation','reject-full-heartbeat-green-from-click-scan-smoke-or-source-deploy-without-provider-effect-holdout-and-applied-learning'],
    playbooks:['market-opportunity-triage','growth-experiment-loop','commercial-signal-validation','portal-causal-input-to-cro-decision-and-ack'],
    learningContracts:[...sharedLearning,'growth.v1','market.v1'],
  }),
  // The legacy Make executor is retired: route integrations only to the approved
  // canonical connector/Composio lineage and never instantiate an alternate publisher.
  Object.freeze({
    id:'agent-integration-composio',
    domains:['Integration','Automation'],
    capabilities:['analyze','integrate','recover','optimize','verify'],
    tasks:['validate-canonical-connector-contract','diagnose-provider-identity-or-scope','repair-safe-mapping','reconcile-provider-readback'],
    playbooks:['composio-canonical-connector-recovery','least-privilege-capability-reconciliation','idempotent-integration-delivery'],
    learningContracts:[...sharedLearning,'integration.v1','delivery.v1'],
  }),
  // This is an existing-fabric specialist, not a new scheduler, publisher or writer.
  // It owns source-to-provider handoffs; the protected integration engineer remains
  // the sole code writer and the authorized original publisher remains the only sender.
  Object.freeze({
    id:'agent-social-delivery-recovery',
    domains:['Social','Content','Integration','Reliability'],
    capabilities:['analyze','diagnose','recover','verify','coordinate'],
    tasks:['diagnose-stalled-daily-obligation','request-fresh-verified-source','coordinate-editorial-and-security-gates','reconcile-original-provider-publication','submit-verified-outcome-learning','consume-original-content-closed-loop-owner-action','verify-exact-channel-provider-id-before-resolution','reconcile-original-provider-window-and-evaluation-receipt','verify-evaluation-to-obligation-cas-ack','retry-canonical-evidence-handoff-without-new-worker','classify-missing-historical-evidence-as-evidence-gap-not-success','require-proven-next-natural-post-learning-application','reconcile-overdue-original-provider-to-metric-to-learning-acks-without-republish'],
    playbooks:['same-obligation-fingerprint-recovery','fresh-source-not-rephrased-duplicate','single-writer-protected-release','identity-and-provider-readback-truth','source-to-consumer-ack-before-resolution','no-reopening-acknowledged-windows','recover-with-original-hourly-owner'],
    learningContracts:[...sharedLearning,'reliability.v1','content.v1','delivery.v1'],
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
