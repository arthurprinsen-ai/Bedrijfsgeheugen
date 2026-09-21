export const POWERHOUSE_SYSTEM_MAP = Object.freeze({
  version:'powerhouse-live-system-map-v1',
  fingerprint:'powerhouse-canonical-system-map-agent-update-contract-v1',
  observedAt:'2026-09-21T16:34:00Z',
  notionAuthority:Object.freeze({
    workspaceId:'950da36a-ac8a-816b-ac6e-0003f91dfb3d',
    systemMapPageId:'3dcda36a-ac8a-8152-be3d-edbb32b06239',
    humanHandbookPageId:'3dcda36a-ac8a-81ac-aad1-c88751e9e814',
    masterRegisterPageId:'3c3da36a-ac8a-81dd-a3fe-c4fc12bba5df',
    latestVerifiedState:'Powerhouse Latest Verified State',
    agentActivityLog:'Powerhouse Agent Activity Log'
  }),
  sources:Object.freeze([
    Object.freeze({id:'github',label:'GitHub',role:'Code, policies, skills, tests, workflows, migrations, delivery evidence',authority:true}),
    Object.freeze({id:'netlify',label:'Netlify',role:'Website, Portal V2, Identity, thin API boundary, production deploy/readback',authority:true}),
    Object.freeze({id:'supabase',label:'Supabase',role:'Canonical runtime, Postgres, RLS, Edge Functions, cron, operating loop, evidence, outcomes, learning',authority:true}),
    Object.freeze({id:'notion',label:'Notion',role:'Human-readable System Map, handbook, current state, activity log and verified-state projection',authority:true}),
    Object.freeze({id:'portal',label:'Portal V2',role:'Human control surface over canonical runtime truth',authority:false}),
    Object.freeze({id:'external',label:'External providers',role:'Buffer, DataForSEO, Tavily, Google, OpenArt and future connectors; provider truth/readback',authority:false})
  ]),
  intelligenceLayers:Object.freeze([
    Object.freeze({id:'evidence',label:'Evidence & provenance',purpose:'Observed facts, source identity, freshness, confidence and evidence refs'}),
    Object.freeze({id:'knowledge',label:'Knowledge & memory',purpose:'Documents, context, canonical state, reusable learning and lineage'}),
    Object.freeze({id:'graph',label:'Execution & capability graph',purpose:'Objects, relations, dependencies, capabilities, systems and owners'}),
    Object.freeze({id:'semantics',label:'Semantic intelligence',purpose:'Normalize meaning across sources, domains, entities and events'}),
    Object.freeze({id:'signals',label:'Signals & external intelligence',purpose:'Market, SEO, regulation, analytics, provider and customer signals'}),
    Object.freeze({id:'prediction',label:'Prediction & foresight',purpose:'Forecasts, opportunity prediction, scenario and calibration'}),
    Object.freeze({id:'impact',label:'Impact & value intelligence',purpose:'Expected and realized value, cost, CO2e, water, risk and ROI'}),
    Object.freeze({id:'decision',label:'Decision intelligence',purpose:'Priority, next-best-action, constraints and explainable recommendations'}),
    Object.freeze({id:'agents',label:'Agent fabric',purpose:'Route work to agents, bounded execution, collaboration, recovery and self-heal'}),
    Object.freeze({id:'delivery',label:'Delivery intelligence',purpose:'PR, CI, exact-head gates, protected merge, deploy and production readback'}),
    Object.freeze({id:'learning',label:'Learning & prevention',purpose:'Root cause, failed approaches, regression, prevention and skill projection'}),
    Object.freeze({id:'governance',label:'Trust, security & compliance',purpose:'Auth, RLS, admin boundaries, AI governance, evidence coverage and controls'}),
    Object.freeze({id:'resource',label:'Resource & sustainability',purpose:'Costs, credits, compute, storage, bandwidth, energy/CO2e/water proxies and efficiency'})
  ]),
  flow:Object.freeze([
    Object.freeze({from:'external',to:'supabase',label:'signals / provider evidence / outcomes'}),
    Object.freeze({from:'portal',to:'netlify',label:'authenticated requests'}),
    Object.freeze({from:'netlify',to:'supabase',label:'thin API / canonical runtime'}),
    Object.freeze({from:'supabase',to:'portal',label:'runtime projection / evidence / recommendations'}),
    Object.freeze({from:'github',to:'netlify',label:'main → build/deploy'}),
    Object.freeze({from:'github',to:'supabase',label:'versioned migrations / edge functions / contracts'}),
    Object.freeze({from:'supabase',to:'notion',label:'human projection / current state / activity'}),
    Object.freeze({from:'notion',to:'github',label:'human contract / architecture authority / operating context'}),
    Object.freeze({from:'supabase',to:'github',label:'evidence → tests / learning / delivery obligations'}),
    Object.freeze({from:'github',to:'notion',label:'release evidence / docs / system-map writeback'})
  ]),
  inventories:Object.freeze({
    githubWorkflows:Object.freeze(["add-netlify-component-preview.yml","approved-central-blog.yml","autonomous-improvement-completion-gate.yml","bg168-materiality-promotion-tests.yml","bg184-stateful-blocker-dedupe-tests.yml","blog-bijwerken.yml","blog-technical-seo-gate.yml","brain-foundation-diagnostic.yml","brain-foundation-verify.yml","buffer-social-learning.yml","business-os-experience.yml","business-os-foundation.yml","business-os-intelligence.yml","business-os-live-preview.yml","business-os-migration.yml","business-os-trust.yml","canonical-brand-shell-full-build.yml","canonical-brand-shell-live-readback.yml","canonical-brand-shell-test.yml","chat-learning-preflight-pr.yml","codeql.yml","completion-supervisor-backfill-shadow.yml","compliance-status-contract.yml","component-foundation-tdd.yml","component-integration-tdd.yml","component-preview.yml","config-wacht.yml","content-growth-ci.yml","content-growth-learning.yml","daily-blog-live-watchdog.yml","daily-blog-publisher.yml","engineering-intelligence-trust.yml","engineering-os-learning.yml","engineering-supply-chain-trust.yml","error-learning-contract.yml","fresh-device-autonomy-canary.yml","hero-media-production-verify.yml","homepage-hero-video-verify.yml","homepage-pricing-boundary-regression.yml","klanten-uit-broncode.yml","lane-automation.yml","lane-backend.yml","lane-portal.yml","lane-website.yml","learning-contract-delivery-classifier-tests.yml","linkedin-revenue-cockpit-tests.yml","live-preview-smoke.yml","main-protection-observation.yml","main-write-integrity-regression.yml","main-write-integrity.yml","menu-balk-fix.yml","native-approved-blog-supply.yml","obligation-terminal-closure.yml","outcome-obligation-sweep.yml","paginacontrole-debug.yml","paginacontrole.yml","portal-native-regression-tests.yml","portal-parity.yml","portal-v2-live-preview.yml","portal-v2-production-dom-readback.yml","portal-v2-tests.yml","powerhouse-assurance.yml","powerhouse-closure-a-f.yml","powerhouse-codeql.yml","powerhouse-daily-blog.yml","powerhouse-daily-self-evolution.yml","powerhouse-delivery-hygiene.yml","powerhouse-delivery-recovery-supervisor.yml","powerhouse-foresight-autonomy.yml","powerhouse-merged-branch-cleanup.yml","powerhouse-obligation-terminalizer.yml","powerhouse-public-rls-regression-guard.yml","powerhouse-quality-intelligence.yml","powerhouse-quality-surface-gate.yml","powerhouse-repository-janitor.yml","powerhouse-resource-intelligence.yml","powerhouse-scan-production-proof.yml","powerhouse-security-operations-closure.yml","powerhouse-skill-projection.yml","powerhouse-supabase-security-contract.yml","powerhouse-terminal-writer-lease-closure-guard.yml","prijzen-hero-seo-regression.yml","production-release-readback.yml","production-source-snapshot.yml","regelgeving-actueel.yml","regelgeving-bijwerken.yml","regulatory-source-watch.yml","repo-writer-candidate-shadow.yml","repo-writer-cheap-canary.yml","repo-writer-gate-dispatch.yml","repo-writer-operational-verification.yml","repo-writer-parity-rollback.yml","repository-hygiene.yml","required-test.yml","revenue-content-intelligence.yml","revenue-learning.yml","runtime-authority-governance-tests.yml","security-operations-proof.yml","seo-controle.yml","seo-growth-intelligence.yml","seo-order-engine.yml","shared-agent-memory-tests.yml","supabase-pr-preview.yml","unified-brain-delivery.yml","unified-content-operations.yml","universal-closed-loop-learning.yml","universal-event-retention-contract.yml","v18-megamenu-production-readback.yml","v18-production-promotion.yml","verify-approved-central-blog.yml","weekblog.yml","whole-brain-canonical-loop-v2.yml","writer-certification-reconcile.yml","writer-production-reconcile.yml"]),
    netlifyFunctions:Object.freeze(["_ai-usage-store.mjs","_brain-ai.mjs","_brain-event-store.mjs","_buffer-social-collector.mjs","_commercial-lead.mjs","_connector-ai.mjs","_cost-projection-store.mjs","_portal-connectors-store.mjs","_portal-eu-primary-store.mjs","_portal-project-store.mjs","_portal-read-model-store.mjs","_portal-supabase-store.mjs","_revenue-learning-model.mjs","_revenue-learning-store.mjs","_social-learning-model.mjs","_social-learning-store.mjs","brain-operating-ingest.mjs","brain-operating-loop.mjs","brain-runtime-metric.mjs","buffer-social-collect.mjs","checkout-create.mjs","checkout-readiness.mjs","company-decision-notion-sync.mjs","company-decision.mjs","connector-ai-guide.mjs","connector-readiness.mjs","content-learning-application-reconcile.mjs","content-learning.mjs","document-extractor.mjs","growth-event.mjs","growth-intelligence-daily.mjs","growth-outcome.mjs","growth-replay.mjs","i18n-translate.mjs","instagram-video-frames.mjs","koppelingen.mjs","linkedin-revenue-cockpit.mjs","monitor.mjs","portaalvraag.mjs","portal-business-input.mjs","portal-connectors.mjs","portal-entitlements.mjs","portal-feedback.mjs","portal-ondernemersdata.mjs","portal-project.mjs","portal-scans.mjs","portal-state.mjs","powerhouse-control-plane-evidence.mjs","powerhouse-composio-config.mjs","powerhouse-composio-secret-sync.mjs","powerhouse-composio-secret-sync-deploy.mjs","powerhouse-composio-secret-sync-now.mjs","powerhouse-control-plane.mjs","powerhouse-costs.mjs","powerhouse-meta-instagram-config.mjs","powerhouse-observability.mjs","powerhouse-scan-ingest.mjs","revenue-learning-context.mjs","revenue-learning-evaluate.mjs","revenue-learning-project.mjs","social-learning-context.mjs","social-learning-evaluate.mjs","social-outcome-ingest.mjs","social-publication-delivery.mjs","stripe-webhook.mjs","vraag.mjs"]),
    supabaseFunctions:Object.freeze(["bg-analytics-sync-composio","bg-buffer-sync","bg-dagoverzicht","bg-ga4-sync","bg-notion-sync","bg-opdrachtenradar","bg-pre-publish-review","brain-operating-authority","brain-runtime-metric-ingest","commercial-lead-ingest","content-operations","growth-datahub-ingest","portal-state-eu","powerhouse-composio-instagram-setup","powerhouse-content-loop","powerhouse-content-orchestrator","powerhouse-dataforseo-intelligence","powerhouse-forecast-calibrator","powerhouse-instagram-media-router","powerhouse-instagram-media-verifier","powerhouse-meta-instagram-setup","powerhouse-predictive-engine","powerhouse-revenue-intelligence","powerhouse-runtime","powerhouse-system-map-inventory","powerhouse-scan-ingest","powerhouse-social-publisher","resource-usage-eu","revenue-learning-store","social-learning-store"]),
    skills:Object.freeze(["instagram-composio-publisher","personal-linkedin-life-only","powerhouse-continuity","powerhouse-delivery-concurrency","powerhouse-delivery-self-optimization","powerhouse-resource-sustainability","powerhouse-toolchain-authority","seo-revenue-growth"]),
    agentFabricModules:Object.freeze(["agent-fabric.mjs","agent-registry.mjs","agent-team.mjs","agent-work.mjs","completion-supervisor.mjs","learning-memory.mjs","self-heal.mjs","team-memory-bridge.mjs"])
  }),
  providerSnapshot:Object.freeze({
    supabase:Object.freeze({tables:255,views:116,functions:204,activeCronJobs:50,projectId:'adhjwmvyoixzjtmiroln'}),
    github:Object.freeze({workflows:114,skills:8,agentFabricModules:8}),
    netlify:Object.freeze({functions:66}),
    notion:Object.freeze({canonicalSystemMap:true,humanHandbook:true,latestVerifiedState:true,agentActivityLog:true})
  }),
  agentRegistrationContract:Object.freeze({
    required:true,
    rule:'Every material current or future chat, agent, workflow or autonomous capability must be an intrinsic Powerhouse loop node and must become discoverable in this System Map through canonical runtime actor evidence and/or repository inventory registration.',
    beforeWork:Object.freeze(['read canonical System Map','read current state and open obligations','reuse existing capability before creating a new one']),
    onCreateOrChange:Object.freeze(['register component/agent identity','declare owner, domain, inputs, outputs and relations','emit runtime evidence with actor identity','update tests/contracts/inventory when structural topology changes']),
    beforeTerminal:Object.freeze(['production/provider readback','learning + prevention writeback','skill projection when applicable','System Map read-after-write']),
    failClosed:'An unregistered material agent/capability or a stale topology inventory is WRITEBACK_INCOMPLETE and cannot be LIVE_BEWEZEN.'
  })
});
