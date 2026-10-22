export const POWERHOUSE_SYSTEM_MAP = Object.freeze({
  version:'powerhouse-live-system-map-v2',
  fingerprint:'powerhouse-canonical-system-map-agent-update-contract-v1',
  observedAt:'2026-10-22T17:03:04.907Z',
  requiredGateWatchdogResilience:Object.freeze({owner:'Required Gate Watchdog',source:'.github/scripts/required-gate-watchdog.mjs',cron:'*/5 * * * *',boundedGetAttempts:2,readTimeoutMs:8000,perPrErrorIsolation:true,ambiguousWriteRetry:false,productionVerified:false}),
  brainFullFailureTriage:Object.freeze({fingerprint:'delivery|brain|first-failure-only-learning-blindspot|20261022-v1',source:'tools/delivery/brain-failure-clustering.mjs',workflow:'.github/workflows/unified-brain-delivery.yml',authority:'existing-failed-lane-artifact',maxCases:5000,model:'observation-only',productionVerified:false}),
  portalLearningOutcomeProof:Object.freeze({source:'brain/operating-loop/living-memory.mjs',proof:'tenant-matched-verified-outcome-and-evidence',unknown:'REVIEW_REQUIRED',storedRecordsModified:false,productionVerified:false}),
  explanationInventory:Object.freeze({contract:'portal-explanation-autosync-v1',contentHash:'adcb2805d70c50503999a1cce99bb869605699c224b698e777478941cc6b47e0',authority:'repository-source',providerRuntimeVerified:false}),
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
    Object.freeze({id:'portal',label:'Portal',role:'Single human control surface over canonical runtime truth; portal/, portal-next/ and portal-v2/ are implementation paths, not product variants',authority:false}),
    Object.freeze({id:'external',label:'External providers',role:'Composio, DataForSEO, Tavily, Google, OpenArt and authorized connectors; provider truth/readback; legacy Buffer artifacts are historical, not an active publishing route',authority:false})
  ]),
  intelligenceLayers:Object.freeze([
    Object.freeze({id:'evidence',label:'Evidence & provenance',purpose:'Observed facts, source identity, freshness, confidence and evidence refs'}),
    Object.freeze({id:'knowledge',label:'Knowledge & memory',purpose:'Documents, context, canonical state, reusable learning and lineage'}),
    Object.freeze({id:'graph',label:'Company, execution & capability graph',purpose:'Typed people, company, opportunity, action, outcome, dependency, capability, system and owner relations with canonical lineage'}),
    Object.freeze({id:'semantics',label:'Semantic intelligence',purpose:'Normalize meaning across sources, domains, entities and events'}),
    Object.freeze({id:'signals',label:'Signals & external intelligence',purpose:'Market, SEO, regulation, analytics, provider and customer signals'}),
    Object.freeze({id:'prediction',label:'Prediction & foresight',purpose:'Forecasts, opportunity prediction, scenario and calibration'}),
    Object.freeze({id:'impact',label:'Impact & value intelligence',purpose:'Expected and realized value, cost, CO2e, water, risk and ROI'}),
    Object.freeze({id:'decision',label:'Decision intelligence',purpose:'Priority, next-best-action, constraints and explainable recommendations'}),
    Object.freeze({id:'agents',label:'Agent fabric',purpose:'Route work to agents, bounded execution, collaboration, recovery and self-heal'}),
    Object.freeze({id:'delivery',label:'Delivery intelligence',purpose:'PR, CI, exact-head gates, protected merge, deploy and production readback'}),
    Object.freeze({id:'learning',label:'Learning & prevention',purpose:'Root cause, failed approaches, regression, prevention and skill projection'}),
    Object.freeze({id:'self-improvement',label:'Self-improvement & evals',purpose:'Agent objectives, provider-neutral model routing, architecture health, candidate evaluation, controlled promotion and learning compilation'}),
    Object.freeze({id:'governance',label:'Trust, security & compliance',purpose:'Auth, RLS, admin boundaries, AI governance, evidence coverage and controls'}),
    Object.freeze({id:'resource',label:'Resource & sustainability',purpose:'Costs, credits, compute, storage, bandwidth, energy/CO2e/water proxies and efficiency'})
  ]),
  runtimeCapabilities:Object.freeze([
    Object.freeze({
      id:'github-failed-gate-same-owner-recovery-v1',
      fingerprint:'delivery|failed-gate|watchdog-observation-only|20261022-v1',
      label:'Existing five-minute Required Gate Watchdog routes failed exact-head Required and CodeQL evidence to the original PR owner',
      owner:'existing GitHub Required Gate Watchdog / immutable PR writer lease',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      authority:'.github/workflows/required-gate-watchdog.yml + tools/delivery/failed-gate-owner-routing.mjs',
      inputs:Object.freeze(['latest exact-head Required test / CodeQL run','original PR lease and obligation','immutable failing job evidence']),
      outputs:Object.freeze(['one deduplicated source-repair handoff per gate/head','existing missing-Required dispatch unchanged','unresolved failure remains not green']),
      evidence:'tests/brain-required-failed-gate-owner-routing-v1.test.mjs',
      learning:'brain/learning/2026-10-22-failed-gate-owner-routing-v1.json',
      documentation:'docs/changes/2026-10-22-failed-gate-owner-routing-v1.md',
      obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742',
      noNewScheduler:true, noNewIncidentStore:true, noSecondWriter:true,
      arbitrarySourceFixAutoExecutionProven:false, productionReadbackProven:false
    }),
    Object.freeze({
      id:'portal-eight-outcomes-connected-journey-v1',
      fingerprint:'portal|eight-outcomes|connected-entrepreneur-journey|v1',
      label:'Connected goal-first Frisse Blik, cockpit, source-backed Winstnavigator and page impact journey',
      owner:'ONE BRAIN / existing Portal V2, Powerhouse and Heartbeat read authorities',
      status:'LIVE_PROVEN_PROVIDER_TRUTH',
      authority:'existing authenticated /api/portal-state, /api/portal-scans and canonical BusinessInput / Brain ACK',
      inputs:Object.freeze(['tenant-verified scan claim','selected business goal','source-backed Powerhouse actions','tenant historical observations','canonical mutation impact and Brain ACK','heartbeat runtime when observed']),
      outputs:Object.freeze(['one guided next step','single contextual dashboard and navigator','unknown-safe forecasts','affected page links without invented calculations','verified outcome only with original evidence']),
      managementSources:Object.freeze({github:'protected code, CI and immutable deploy evidence, not customer finance',netlify:'production artifact/readback, not direct company data',notion:'governed architecture and learning, not an unapproved tenant runtime feed',supabase:'only authorized tenant-owned canonical data and RLS-protected records',composio:'connector side effects only through existing authorized Brain/Powerhouse capability and provider receipts'}),
      evidence:'tests/brain-portal-entrepreneur-goal-home-v1.test.mjs',
      documentation:'docs/changes/portal-connected-entrepreneur-journey-20261021-v1.md',
      learning:'brain/learning/2026-10-21-portal-connected-entrepreneur-journey-v1.json',
      obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4585',
      noSecondPortal:true,noNewScheduler:true,authenticatedTwoTenantAcceptance:false,providerProductionEvidenceVerified:true,
      principalBoundRuntimeFix:'LIVE_PROVEN_PROVIDER_TRUTH',
      principalBoundRuntimeProductionMainSha:'dafece9841bcc248f455f0b9beb2520ac13b18fa',
      principalBoundRuntimeNetlifyDeployId:'6ad910c695b04087a1c90a26',
      principalBoundRuntimePublishedAt:'2026-10-21T19:23:50.367Z',
      principalBoundRuntimeE2EAccepted:false,
      runtimeReadbackAuthority:'Existing bearer-authenticated Brain operating-loop projection; transient runtime bound to current principal, cleared on account switch; no Notion/GitHub/Composio data promoted to customer KPIs',
      runtimeReadbackAcceptance:'Real tenant A/B and connector provider receipts remain pending',
      productionMainSha:'20abd485e7956bf8f1aa541a52076533269e4569',
      productionDeployId:'6ad88550dd76a312a37b77fc',
      productionPublishedAt:'2026-10-21T09:28:54.780Z',
      verifiedBoundary:'Protected release and Netlify main/current exact SHA proven; independent 2-real-customer E2E/connector/forecast acceptance still pending'
    }),
    Object.freeze({
      id:'portal-entrepreneur-goal-home-v1',
      fingerprint:'portal|frisse-blik|goal-first-entrepreneur-home|v1',
      label:'One tenant-scoped entrepreneur goal, scan evidence and actionable next best step on the original Portal V2 home',
      owner:'ONE BRAIN / existing Portal V2 and Powerhouse',
      status:'LIVE_PROVEN_PROVIDER_TRUTH',
      authority:'existing authenticated portal.business_context canonical store, scan-claim readback and evidenced tenant Powerhouse model',
      inputs:Object.freeze(['verified same-tenant scan assessment if present','customer-selected primary business goal','measurable goal target','healthy and sourced next best proposal']),
      outputs:Object.freeze(['goal-first personalized portal home','single contextual next-step route','write confirmation only after tenant-state and Brain ACK','no invented business result']),
      evidence:'portal-v2/tests/entrepreneur-home.test.mjs',
      documentation:'docs/changes/portal-entrepreneur-goal-home-20261021-v1.md',
      learning:'brain/learning/2026-10-21-entrepreneur-goal-home-v1.json',
      obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4578',
      noNewScheduler:true, noParallelSourceOfTruth:true, productionEvidenceVerified:true,
      productionDeployId:'6ad86f363d80b09aaceebcfc',
      productionMainSha:'a57b7c93e731b95aaf90fdf77276d10fe5f9f48b',
      publishedAt:'2026-10-21T07:54:26.530Z',
      customerAcceptance:'PENDING_TWO_AUTHENTICATED_CUSTOMER_JOURNEYS',
      proofScope:'Protected merge + Netlify exact commit and ready production deploy; not a two-tenant customer-data acceptance'
    }),
    Object.freeze({id:'saas-customer-loop-v1',label:'Persisted SaaS checkout and scan-to-account continuity',owner:'existing Stripe / Netlify Identity / Supabase authorities',status:'CHECKOUT_ARTIFACT_RECOVERY_BILLING_BLOCKED',authority:'canonical plans, verified webhook, server-side paid invitation, canonical scan receipts, final NL/EN checkout artifact contract',inputs:Object.freeze(['plan and billing choice','confirmed account','completed scan']),outputs:Object.freeze(['durable intent and subscription receipt','same-organisation portal entitlements','tenant-bound self-reported assessment history']),evidence:'tests/saas-pricing-entitlements.test.mjs',learning:'brain/learning/2026-10-21-saas-customer-loop.json'}),
    Object.freeze({id:'portal-ai-passport-model-binding-v1',fingerprint:'portal|ai-passport|tenant-model-choice-live-projection|v1',label:'Tenant AI choice and data passport share canonical state and evidence',owner:'ONE BRAIN / existing Portal tenant state and sovereignty Heartbeat',status:'CANDIDATE_PROTECTED_DELIVERY',authority:'authenticated tenant domainState + sovereignty/security registry + AI activation readiness',inputs:Object.freeze(['portal.aiModelPreferences','data-sovereignty.aiRoutes','tenant-ai-activation-status','portal.runtime.observability.updatedAt']),outputs:Object.freeze(['requested default and workload models','model-specific data-processing facts','readiness separate from execution','identity-safe coalesced readback']),evidence:'tests/brain-portal-ai-passport-model-binding-v1.test.mjs',obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4152',learning:'brain/learning/2026-10-20-ai-passport-model-binding-v1.json'}),
    Object.freeze({
      id:'portal-explanation-autosync-v1',
      fingerprint:'portal-explanation-autosync-20261020-v1',
      label:'Portal explanations and repository inventories follow the same protected release',
      owner:'existing System Map governance / Netlify build / Required test / daily self-evolution',
      authority:'repository source; provider runtime evidence remains separate',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      runtime:'scripts/brain/portal-explanation-inventory.mjs',
      surfaces:Object.freeze(['powerhouse-control-center/system-map','powerhouse-control-center/layers','powerhouse-control-center/knowledge','brain-verwerking','rekenwijze']),
      regression:'tests/brain-portal-explanation-autosync-v1.test.mjs',
      learning:'brain/learning/2026-10-20-portal-explanation-autosync-v1.json',
      noNewScheduler:true, sourceInventoryIsNotRuntimeProof:true, semanticReviewRequired:true
    }),
    Object.freeze({
      id:'portal-entrepreneur-source-freshness-v1',
      fingerprint:'portal|entrepreneur-source|stale-current-and-null-eur-zero|v1',
      label:'Tenant entrepreneurship projections preserve canonical refresh timestamp, source staleness, and unknown monetary values',
      owner:'ONE BRAIN / existing Supabase EU portal-state-eu read-model',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      authority:'canonical Source Universe source revision + authenticated tenant impact and action scope',
      inputs:Object.freeze(['powerhouse_intelligence_snapshot_v1.refreshed_at','actual observed external signals','authenticated company impacts','known monetary evidence']),
      outputs:Object.freeze(['CURRENT only after verified <=2h canonical refresh','STALE/PARTIAL/EMPTY fail-closed status','NULL for unknown euro values']),
      evidence:'tests/brain-portal-entrepreneur-source-freshness-v1.test.mjs',
      obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215',
      learning:'brain/learning/2026-10-20-portal-entrepreneur-source-freshness-v1.json'
    }),
    Object.freeze({
      id:'verified-scan-claim-immediate-brain-readback-v1',
      fingerprint:'portal|verified-frisseblik-claim|canonical-brain-readback|v1',
      label:'Verified Frisse Blik/Bedrijfslek claims refresh existing tenant-specific Brain dashboards',
      owner:'ONE BRAIN / original scan-ingest and Portal V2 read-model',
      authority:'Netlify Identity-bound scan claim ACK, Supabase canonical-brain projection, Portal V2 state refresh',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['verified same-tenant provider claim receipt','canonical projection persistence','authenticated unchanged tenant principal']),
      outputs:Object.freeze(['live read-model update for existing portal dashboards','no duplicate scan claim','unsaved customer edits preserved']),
      evidence:'tests/brain-portal-claim-propagation-v1.test.mjs',
      obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215',
      learning:'brain/learning/2026-10-20-frisseblik-verified-claim-live-brain-readback-v1.json'
    }),
    Object.freeze({
      id:'portal-profile-no-fake-input-defaults-v1',
      fingerprint:'portal|customer-profile|no-fabricated-maturity-and-financial-benchmark|v1',
      label:'Real customer profile KPI is unknown until every source input is explicitly entered',
      owner:'ONE BRAIN / Portal V2 dashboard and profile models',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      authority:'same-tenant authenticated portal.profile explicit customer values',
      inputs:Object.freeze(['employees','hourlyCost','13 maturity fields']),
      outputs:Object.freeze(['null when incomplete','assumption-based estimate when complete','no fictitious baseline cash savings']),
      evidence:'tests/brain-portal-profile-no-synthetic-kpis-v1.test.mjs',
      obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215',
      learning:'brain/learning/2026-10-20-profile-input-backed-kpis-v1.json'
    }),
    Object.freeze({
      id:'portal-safe-canonical-revalidation-v1',
      fingerprint:'portal|authenticated-refresh|safe-domain-state-revalidation|v1',
      label:'Visible Portal V2 pages revalidate authenticated tenant Brain data without erasing edits',
      owner:'ONE BRAIN / Portal V2 existing tenant-state authority',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      authority:'existing signed-in Netlify /api/portal-state → canonical Supabase state → tenant BusinessInput and organism ACK',
      inputs:Object.freeze(['authenticated tenant readback','verified current principal','unchanged local revision','no pending business input']),
      outputs:Object.freeze(['changed server data reflected in dashboard and open page','stale cross-tenant response blocked','dirty customer input preserved']),
      evidence:'tests/brain-portal-live-revalidation-v1.test.mjs',
      obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215',
      learning:'brain/learning/2026-10-20-portal-server-live-revalidation-v1.json'
    }),
    Object.freeze({
      id:'portal-economics-null-not-zero-v1',
      fingerprint:'portal|brain-runtime|unknown-monetary-values-never-zero|v1',
      label:'Portal economics distinguishes absent source amounts from actual measured zero',
      owner:'ONE BRAIN / existing authenticated Portal V2 runtime',
      authority:'tenant-bound Brain operating-loop decisionEconomics',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['source economic measurements','explicit measured zero','absence of source data']),
      outputs:Object.freeze(['null unknown economics','no fabricated value leakage','visible unavailable money state']),
      evidence:'portal-v2/tests/company-decisions.test.mjs',
      learning:'brain/learning/2026-10-20-portal-unknown-financial-values-v1.json',
      obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215'
    }),
    Object.freeze({
      id:'source-universe-existing-mux-stage-v1',
      fingerprint:'powerhouse|source-universe|scheduler-v3-dropped-refresh-stage|v1',
      label:'Canonical Source Universe refresh stays in the existing Powerhouse runtime mux',
      owner:'Powerhouse runtime scheduler v3 / existing pg_cron job 171',
      authority:'existing source universe, source observations and signal/action/outcome lineage',
      status:'MANUAL_PROVIDER_CANARY_PASSED_SCHEDULED_RECEIPT_PENDING',
      inputs:Object.freeze(['bounded external source observations','UTC minute 54 existing mux slot','canonical tenant scope']),
      outputs:Object.freeze(['refreshed external intelligence snapshot','bounded materialization and outcome reconciliation','source task receipt and aggregate fail-closed health']),
      regression:'tests/brain-source-universe-operational-truth-v1.test.mjs',
      migration:'supabase/migrations/20261020080000_restore_external_intelligence_existing_mux_v3.sql',
      obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215',
      learning:'brain/learning/2026-10-20-source-universe-scheduler-mux-stage-recovery-v1.json',
      invariants:Object.freeze({noParallelScheduler:true,neverFabricateMoney:true,externalActionNotAuthorized:true,taskFailureNotGreen:true})
    }),
    Object.freeze({
      id:'portal-tenant-source-freshness-v1',
      fingerprint:'portal|tenant-projection|nested-freshest-source-readback|v1',
      label:'Portal V2 merges nested tenant inputs by verified source revision without losing unrelated fields',
      owner:'ONE BRAIN / existing Supabase EU portal-state projection',
      authority:'authenticated tenant-scoped BusinessInput ACK, original canonical projection timestamps',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['legacy-migration sourceUpdatedAt','canonical-brain sourceUpdatedAt','same-tenant portal fields']),
      outputs:Object.freeze(['lossless tenant portal read model','cross-page field consistency','tenant-mismatch rejection']),
      evidence:'tests/brain-portal-source-truth-20261019.test.mjs',
      obligation:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215',
      learning:'brain/learning/2026-10-20-portal-tenant-projection-freshest-nested-source-v1.json'
    }),
    Object.freeze({
      id:'portal-future-lens-source-truth-v1',
      fingerprint:'portal|foresight|no-dom-derived-confidence-or-forecast|v1',
      label:'Portal Future Lens uses evidence-backed tenant forecasts only',
      owner:'ONE BRAIN / Portal V2 / Powerhouse Foresight',
      authority:'authenticated canonical tenant forecast + independent quality proof',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['tenant-bound verified source references','validated model version and backtest','latest provenance date','canonical customer forecast']),
      outputs:Object.freeze(['numerical forecast only with source proof','unknown instead of synthetic confidence','existing contextual foresight and action navigation']),
      runtime:Object.freeze({
        implementation:'portal-v2/nextgen-intelligence.js',
        regression:'portal-v2/tests/nextgen-intelligence.test.mjs',
        learning:'brain/learning/2026-10-19-portal-future-lens-source-truth-v1.json',
        documentation:'docs/changes/2026-10-19-portal-future-lens-source-truth-v1.md'
      }),
      invariants:Object.freeze({
        noDomForecast:true,noFabricatedConfidence:true,sourceAndTenantRequired:true,
        independentBacktestRequired:true,noAutomaticFinancialClaims:true,protectedMergeRequired:true,
        authenticatedProductionReadbackRequired:true
      })
    }),
    Object.freeze({
      id:'portal-workspace-async-generation-v1',
      fingerprint:'powerhouse|portal-v2|workspace-mount-generation|v1',
      label:'Portal V2 stable workspace mounts after async navigation',
      owner:'ONE BRAIN / Portal V2',
      authority:'active DOM page root + canonical tenant domain state',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['current Portal V2 navigation target','lazy workspace style/module import','existing Powerhouse customer domain state']),
      outputs:Object.freeze(['fresh workspace generation on each navigation','discard stale async render completions','original source-bound canvas save evidence']),
      runtime:Object.freeze({
        implementation:'portal-v2/workspace-shell.js',
        unitRegression:'tests/brain-portal-workspace-generation-v1.test.mjs',
        productionAcceptance:'tests/integration/portal-v2-production-canvassen.spec.js',
        learning:'brain/learning/2026-10-19-portal-workspace-async-generation.json',
        documentation:'docs/changes/2026-10-19-portal-workspace-generation-reliability.md'
      }),
      invariants:Object.freeze({
        existingPortalOnly:true,staleMountCannotWrite:true,noNewRouter:true,
        tenantStateAuthorityUnchanged:true,saveRequiresServerReceipt:true,
        existingBrowserAcceptanceRequired:true,protectedMergeRequired:true,
        exactProductionReadbackRequired:true
      })
    }),
    Object.freeze({
      id:'portal-immutable-browser-proof-bridge-only-successor-v1',
      fingerprint:'powerhouse|delivery|portal-dom-bridge-only-successor|v1',
      label:'Portal DOM production proof against immutable release when only independent deployment bridge advances',
      owner:'ONE BRAIN / Protected Portal Production Readback',
      authority:'GitHub protected approved PR + immutable Netlify release + verified Supabase deploy bridge source',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['previously published exact Netlify site SHA','approved merged Portal PR ancestry','current main changes without Portal/Netlify runtime changes','exact independent Supabase deploy bridge source']),
      outputs:Object.freeze(['main-only manual Portal DOM browser proof','immutable production SHA and deploy identity','auditable non-bypass of portal/runtime release gates']),
      runtime:Object.freeze({
        workflow:'.github/workflows/portal-v2-production-dom-readback.yml',
        regression:'tests/brain-portal-dom-proven-bridge-only-v1.test.mjs',
        learning:'brain/learning/2026-10-19-portal-readback-bridge-only-override.json',
        documentation:'docs/changes/2026-10-19-portal-dom-immutable-acceptance-v1.md'
      }),
      invariants:Object.freeze({
        singleSiteAuthority:true,approvedPRAncestryRequired:true,
        immutableDeployMatchRequired:true,realBrowserRequired:true,
        onlyExactlyNamedBridgeCanFollowRelease:true,noGenericEdgeFunctionOverride:true,
        portalAndNetlifyRuntimeChangesBlocked:true,noSyntheticProductionGreen:true
      })
    }),
    Object.freeze({
      id:'netlify-pinned-composio-session-health-v1',
      fingerprint:'netlify|composio|pinned-session-health|v1',
      label:'Netlify authorized session tool exposure and provider-health evidence',
      owner:'ONE BRAIN / protected production delivery',
      authority:'GitHub main-only OIDC, Supabase Vault project-scope Composio key, pre-authorized Netlify site',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['active account from same Composio project','two fixed approved Netlify tool slugs','authenticated OIDC read-only provider health']),
      outputs:Object.freeze(['strict positive tool allowlist','privacy-safe HTTP 400 session diagnostics','no provider write without verified authorization']),
      runtime:Object.freeze({
        edge:'supabase/functions/netlify-deploy-bridge/index.ts',
        regression:'tests/brain-netlify-session-tool-exposure-v1.test.mjs',
        learning:'brain/learning/2026-10-19-netlify-session-tool-exposure.json',
        documentation:'docs/changes/2026-10-19-netlify-composio-session-health-v1.md'
      }),
      invariants:Object.freeze({
        existingBridgeOnly:true,oidcRepositoryAndMainOnly:true,
        vaultProjectAuthorityRequired:true,fixedSiteOnly:true,
        readOnlyHealthBeforeWrite:true,noCredentialLogging:true,
        protectedDeploymentAndProviderProofRequired:true
      })
    }),
    Object.freeze({
      id:'netlify-last-live-revision-reconcile-v1',
      fingerprint:'deployment|latest-push-cancels-running-upload|20261019',
      label:'Protected Netlify release reconciliation against last verified production SHA',
      owner:'ONE BRAIN / Production delivery control plane',
      authority:'GitHub protected main + immutable Netlify release source identity',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['latest protected main commit','last verified production release.json commit','cumulative unpublished changed paths']),
      outputs:Object.freeze(['no-cancel in-flight authorized upload','correct cumulative deployment applicability','fail-closed missing-provider-identity reconciliation']),
      runtime:Object.freeze({
        workflow:'.github/workflows/production-source-snapshot.yml',
        helper:'tools/delivery/netlify-live-gap-reconcile.mjs',
        regression:'tests/brain-netlify-live-gap-cancel-starvation-v1.test.mjs',
        learning:'brain/learning/2026-10-19-netlify-release-starvation.json',
        documentation:'docs/changes/2026-10-19-netlify-release-starvation-v1.md'
      }),
      invariants:Object.freeze({
        existingReleaseAuthorityOnly:true,noParallelScheduler:true,
        protectedMergeRequired:true,oidcAuthorizationPreserved:true,
        liveCommitReadbackRequired:true,unknownLiveRevisionFailsClosed:true,
        runningAuthorizedDeployNotCancelled:true,realBrowserProofRequired:true
      })
    }),
    Object.freeze({
      id:'tenant-decision-twin-roadmap-proposal-v1',
      fingerprint:'powerhouse|portal-v2|decision-twin-roadmap-proposal|v1',
      label:'Evidence-backed what-if → tenant roadmap review-only proposal',
      owner:'ONE BRAIN / Portal V2 / Foresight',
      authority:'existing tenant-specific Portal domain-state and roadmap persisted with authenticated flush',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['three independently referenced historical measurements','bounded nonzero scenario assumption','current authenticated tenant state']),
      outputs:Object.freeze(['idempotent roadmap draft','review and owner assignment requirement','explicit zero external-provider dispatch']),
      runtime:Object.freeze({
        studio:'portal-v2/foresight-scenario-studio.js',
        builder:'portal-v2/decision-twin-receipt.js',
        regression:'tests/brain-decision-twin-roadmap-proposal-v1.test.mjs',
        learning:'brain/learning/2026-10-19-decision-twin-roadmap-proposal.json',
        documentation:'docs/changes/2026-10-19-decision-twin-roadmap-proposal-v1.md'
      }),
      invariants:Object.freeze({
        existingPortalOnly:true,noNewBackend:true,realTenantRequired:true,
        distinctEvidenceRequired:true,simulationNeverRealization:true,
        approvedExternalProviderNotInferred:true,clientClickRequired:true,
        domainStateServerAckRequired:true,noSyntheticRevenue:true,
        protectedMergeAndProductionReadbackRequired:true
      })
    }),
    Object.freeze({
      id:'tenant-decision-twin-receipt-v1',
      fingerprint:'powerhouse|portal-v2|decision-twin-proof-receipt|v1',
      label:'Decision Twin — scenario-to-action-to-outcome evidence receipt',
      owner:'ONE BRAIN / Portal V2 / Foresight',
      authority:'existing authenticated tenant portal state, Powerhouse authorized provider receipts and independently verified outcomes',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['tenant-scoped source-backed goal history','existing tenant+goal action','provider-confirmed action receipts','independent tenant outcome evidence']),
      outputs:Object.freeze(['five-level evidence chain','honest what-if differentiation','existing next-best-actions navigation']),
      runtime:Object.freeze({
        receipts:'portal-v2/decision-twin-receipt.js',
        studio:'portal-v2/foresight-scenario-studio.js',
        test:'tests/brain-decision-twin-receipt-v1.test.mjs',
        learning:'brain/learning/2026-10-19-decision-twin-proof-chain.json',
        documentation:'docs/changes/2026-10-19-decision-twin-receipt-v1.md'
      }),
      invariants:Object.freeze({
        existingPortalOnly:true,tenantScopeRequiredForAction:true,
        scenarioNotCausal:true,verifiedHistoryRequired:true,
        providerProofRequiredForExecution:true,independentOutcomeProofRequired:true,
        noSyntheticMoney:true,noConnectorAutoActivation:true,
        noParallelDecisionStore:true,productionReadbackRequired:true
      })
    }),
    Object.freeze({
      id:'growth-drain-budget-replay-v1',
      fingerprint:'powerhouse|growth|bounded-replay-resume|v1',
      label:'Growth and Outcome bounded replay — delivery evidence, not invented success',
      owner:'ONE BRAIN / Powerhouse Growth delivery',
      authority:'Netlify Blobs persisted receipts + Supabase growth-datahub-ingest + external provider acknowledgment',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['existing growth-event and outcome blob receipts','canonical Supabase idempotent datahub ingress','explicitly authorized external webhook']),
      outputs:Object.freeze(['bounded replay with progress checkpoints','fair event/outcome queue order','observable runtime, page and persisted-skip metrics']),
      runtime:Object.freeze({
        scheduler:'netlify/functions/growth-drain.mjs',
        replay:'netlify/functions/growth-replay.mjs',
        regression:'tests/brain-growth-drain-time-budget-v1.test.mjs',
        learning:'brain/learning/2026-10-19-growth-drain-budget-recovery.json',
        documentation:'docs/changes/2026-10-19-growth-drain-runtime-reliability-v1.md'
      }),
      invariants:Object.freeze({
        existingSchedulerOnly:true,noNewSSOT:true,tenantScopedReceipts:true,
        providerProofRequired:true,http499IsNotFailureProof:true,
        replayPersistIdempotently:true,noDisabledDeliverySideEffect:true,
        liveReadbackBeforeSuccess:true,cooperativeBudgetNotHardTimeout:true
      })
    }),
    Object.freeze({
      id:'powerhouse-contextual-foresight-studio-v1',
      fingerprint:'powerhouse|portal-v2|cross-domain-foresight|v1',
      label:'Powerhouse Foresight — interactieve cross-domain scenarioverkenning',
      owner:'ONE BRAIN / Portal V2 / authenticated Brain operating loop',
      authority:'tenant-specific portal goal histories and tenant-authenticated Brain observations only',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['customer historical metrics with provenance','customer strategic goals','authenticated tenant Brain runtime observations']),
      outputs:Object.freeze(['7-domain goal and trend explorer','30/90/180/365 day trend horizons','transparent hypothesis-based what-if scenario charts','contextual dependencies and existing action routes']),
      runtime:Object.freeze({
        model:'portal-v2/foresight-scenario-studio.js',
        mount:'portal-v2/foresight-context-ui.js',
        test:'portal-v2/tests/foresight-scenario-studio.test.mjs',
        learning:'brain/learning/2026-10-15-cross-domain-foresight-4420.json',
        documentation:'docs/changes/2026-10-15-cross-domain-foresight-4420.md'
      }),
      invariants:Object.freeze({
        existingPortalOnly:true, customerHistoryRequired:true, noGlobalForecastLeak:true,
        noSyntheticKpis:true, noScenarioAsPrediction:true, noCausalOrRealizedClaims:true,
        unknownHeartbeatIsNotGreen:true, tenantAuthorizationRequired:true,
        backtestAndIndependentReviewForVerifiedForecast:true
      })
    }),
    Object.freeze({
      id:'daily-entrepreneur-steering-v1',
      fingerprint:'powerhouse|one-brain|daily-entrepreneur-steering|v1',
      label:'Daily entrepreneur steering — know, decide, do, measure, learn',
      owner:'ONE BRAIN / Portal V2 / Outcome Memory',
      authority:'existing-tenant-brain-projection+company-decision-api+verified-outcomes',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['canonical authenticated tenant executive projection','source references and freshness','existing next-best-actions','verified outcomes and learning evidence']),
      outputs:Object.freeze(['daily five-stage human experience','existing decision actions','evidence-backed measurement and learning status']),
      runtime:Object.freeze({
        view:'portal-v2/operating-system/executive-cockpit.js',
        evidence:'portal-v2/operating-system/executive-projection.js',
        decisions:'portal-v2/company-cockpit-ui.js',
        regression:'portal-v2/tests/daily-entrepreneur-steering.test.mjs',
        productContract:'docs/changes/2026-10-09-daily-entrepreneur-steering-v1.md'
      }),
      invariants:Object.freeze({
        noNewModule:true,noNewScheduler:true,oneBrain:true,
        tenantScopedEvidence:true,executedNotRealized:true,
        outcomeReceiptRequired:true,learningEvidenceAndNextDecisionRequired:true,
        noFalseGreen:true,noInertButtonsWithoutAuth:true
      })
    }),
    Object.freeze({
      id:'self-evolving-business-engineering-os-v1',
      fingerprint:'powerhouse|cross-domain-evolution|canonical-evidence|protected-delivery|v1',
      label:'Self-Evolving Business & Engineering OS — cross-domain decision policy',
      owner:'ONE BRAIN / Self-Improvement Layer',
      authority:'existing-brain-outcomes+organism-graph+protected-delivery',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['exact tenant and source revision','existing canonical outcome observations','independent provider/release proof','control-group evidence','GDPR/AI Act/NIS2/CSRD reviews']),
      outputs:Object.freeze(['incremental change impact','missing domain review','deterministic canonical obligation proposal','protected delivery candidate','compiled learning proposal']),
      runtime:Object.freeze({
        planner:'brain/self-improvement/cross-domain-evolution.mjs',
        graph:'platform/organism/organism-graph.mjs',
        evaluation:'brain/self-improvement/self-improvement-layer.mjs',
        tests:'tests/brain-self-evolving-business-engineering-os-v1.test.mjs',
        learning:'brain/learning/2026-10-08-self-evolving-business-engineering-os-v1.json'
      }),
      invariants:Object.freeze({
        oneBrain:true, noParallelScheduler:true, noParallelDatabase:true,
        sameTenantRevision:true, csrdApplicabilityNotInferred:true,
        externalProviderOrReleaseProofRequired:true, causalClaimNeedsControlGroup:true,
        unknownIsNotGreen:true, missingSecurityReviewBlocks:true,
        noDirectProductionMutation:true, existingProtectedDeliveryRequired:true,
        proposalsAreNotExecutedOutcomes:true,
        financialValueRequiresIndependentReadback:true,
        businessValueLinkedToEngineeringOutcome:true
      })
    }),
    Object.freeze({
      id:'source-universe-impact-engine-v1',
      fingerprint:'powerhouse|source-universe|impact-engine|canonical-action|outcome|learning|v1',
      label:'Source Universe & Environment Radar',
      authority:'supabase-evidence-spine+intelligence-projection+canonical-obligations+portal-v2',
      owner:'ONE BRAIN / Signals & External Intelligence',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze([
        'official/public source catalog',
        'existing bg_signaal_onderwerpen taxonomy',
        'bg_externe_signalen observations',
        'tenant/company context when available',
        'existing evidence sources and source observations'
      ]),
      outputs:Object.freeze([
        'source-universe coverage',
        'environment signals',
        'explainable signal ranking',
        'evidence-backed company impact assessments',
        'context-gated next-action candidates',
        'canonical Brain obligations for READY/SCORED actions',
        'verified Outcome Memory reconciliation',
        'portal environment radar'
      ]),
      runtime:Object.freeze({
        domainRegistry:'public.powerhouse_intelligence_domain_registry_v1',
        sourceCatalog:'public.powerhouse_intelligence_source_catalog_v1',
        signalProjection:'public.powerhouse_intelligence_signal_projection_v1',
        signalRelations:'public.powerhouse_intelligence_signal_relation_v1',
        internalEvidenceProjection:'public.powerhouse_project_internal_evidence_signal_v1(...)',
        relationRefresh:'public.powerhouse_refresh_signal_relations_v1(text,integer)',
        impactProjection:'public.powerhouse_intelligence_company_impact_v1',
        actionCandidates:'public.powerhouse_intelligence_action_candidate_v1',
        snapshot:'public.powerhouse_intelligence_snapshot_v1',
        sourceObservations:'public.powerhouse_evidence_source_observations',
        externalSignals:'public.bg_externe_signalen',
        refresh:'public.powerhouse_refresh_external_intelligence_universe_v1(text,integer)',
        impactWrite:'public.powerhouse_upsert_intelligence_company_impact_v1(...)',
        actionPromotion:'public.powerhouse_materialize_intelligence_action_v1(text,text)',
        outcomeReconcile:'public.powerhouse_reconcile_intelligence_outcomes_v1(text)',
        heartbeat:'public.powerhouse_runtime_scheduler_mux_v3(timestamptz) @ minute 54',
        loopAssurance:'external-intelligence-universe',
        api:'netlify/functions/portal-ondernemersdata.mjs',
        portal:'https://www.bedrijfsgeheugen.nl/portaal?page=omgevingsradar',
        learning:'brain/learning/2026-10-07-source-universe-impact-engine-v1.json',
        regression:'tests/brain-source-universe-impact-engine-v1.test.mjs'
      }),
      invariants:Object.freeze({
        existingStateFirst:true,
        oneExternalSignalStore:true,
        oneCanonicalExternalSignalProjection:true,
        tenantImpactOverlayOnly:true,
        noParallelScheduler:true,
        cataloguedDoesNotMeanConnected:true,
        sourceEvidenceSeparatedFromAiInterpretation:true,
        internalSignalsRequireTenantScopedEvidence:true,
        correlationNeverAutoPromotedToCausality:true,
        tenantExposureNeverSynthesized:true,
        monetaryImpactNeverSynthesized:true,
        unknownRemainsUnknown:true,
        canonicalActionAuthorityReused:true,
        actionPromotionRequiresReadyAndScoredImpact:true,
        fulfilledObligationIsNotBusinessOutcome:true,
        verifiedOutcomeRequiredForDone:true,
        observedOutcomeRequiredForLearning:true,
        portalProjectionRequired:true,
        loopAssuranceRequired:true,
        productionReadbackRequired:true
      })
    }),
    Object.freeze({
      id:'data-ai-security-trust-center-v1',
      fingerprint:'powerhouse|security-trust|sovereignty|connector-auto-enrolment|evidence-first|v1',
      label:'Data, AI Sovereignty & Security Trust Center',
      authority:'supabase-security-trust+data-sovereignty+provider-readback',
      owner:'Powerhouse Trust, Security & Compliance / ONE BRAIN',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['tenant policy','providers','AI routes','connector definitions','database posture','management-plane evidence']),
      outputs:Object.freeze(['tenant sovereignty snapshot','security trust snapshot','customer trust answers','findings','framework applicability','provider assurance boundaries']),
      runtime:Object.freeze({
        securitySnapshot:'public.security_trust_snapshot_v1',
        sovereigntySnapshot:'public.data_sovereignty_snapshot_v1',
        securityRefresh:'public.refresh_security_trust_snapshot_v1(text)',
        sovereigntyRefresh:'public.refresh_data_sovereignty_snapshot_v1(text)',
        aiDeploymentPolicy:'public.tenant_data_sovereignty_policy_v1.ai_deployment_profile (desired; never runtime proof)',
        aiDeploymentValidator:'platform/policy/customer-ai-deployment.mjs',
        aiDeploymentPortal:'portal-next/data-sovereignty-panel.js',
        aiDeploymentGuard:'netlify/functions/_data-sovereignty-client.mjs',
        connectorTrigger:'public.connector_definitions -> connector_definitions_trust_refresh_v1',
        heartbeat:'public.powerhouse_refresh_data_sovereignty_v1()',
        tenantGateway:'supabase/functions/portal-state-eu/index.ts',
        netlifyApi:'netlify/functions/security-trust.mjs',
        portal:'https://www.bedrijfsgeheugen.nl/portaal?page=trust-center',
        sovereigntyPortal:'https://www.bedrijfsgeheugen.nl/portaal?page=data-ai-passport',
        accessBoundary:'authenticated customer tenant or Powerhouse admin; demo/public forbidden',
        learning:'brain/learning/2026-10-07-data-ai-security-trust-center-v1.json'
      }),
      invariants:Object.freeze({
        oneHeartbeatAuthority:true,
        onePortalProduct:true,
        technicalPortalPathsAreImplementationOnly:true,
        connectorMutationsRefreshTrustTransactionally:true,
        newConnectorsAutoEnrolled:true,
        connectorTenantMovesRefreshOldAndNewTenant:true,
        providerCertificationDoesNotCertifyBedrijfsgeheugen:true,
        legalApplicabilitySeparatedFromTechnicalEvidence:true,
        staleEvidenceNeverGreen:true,
        sameTenantGateway:true,
        unknownIsNotGreen:true,
        protectedPagesHiddenBeforeLogin:true,
        publicStandaloneSurfaces:false,
        demoTrustAccess:false,
        customerOwnTenantOnly:true,
        canonicalScopeAdminOnly:true,
        notionProjectionRequired:true,
        productionReadbackRequired:true
      })
    }),
    Object.freeze({
      id:'external-observer-provider-truth-v1',
      label:'External Observer Isolation & Netlify Provider Truth',
      authority:'github-lineage+netlify-provider-readback',
      owner:'delivery-control-plane',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['expected production SHA','Netlify published deploy','external observer availability','expected function names when applicable']),
      outputs:Object.freeze(['LIVE_PROVEN_PROVIDER_TRUTH','OBSERVER_UNAVAILABLE','fail-closed evidence mismatch']),
      runtime:Object.freeze({
        contract:'brain/contracts/production-readback-v1.json#externalObserverReadback',
        evaluator:'tools/delivery/external-observer-production-proof.mjs',
        regression:'tests/brain-external-observer-provider-truth.test.mjs',
        agentContract:'AGENTS.md',
        learning:'brain/learning/2026-10-07-external-observer-provider-truth-v1.json'
      }),
      invariants:Object.freeze({
        observerIsNotProductionAuthority:true,
        observerRefusalIsNotOriginFailure:true,
        providerStateReadyRequired:true,
        productionContextRequired:true,
        productionAliasRequired:true,
        exactCommitRefRequired:true,
        expectedFunctionsMustBePresent:true,
        immutableGithubLineageRequired:true,
        canonicalRunnerLiveReadbackNotWeakened:true,
        fabricatedOriginSuccessForbidden:true
      })
    }),
    Object.freeze({
      id:'universal-connected-app-cost-governor-v1',
      label:'Universal Connected-App Cost Governor',
      authority:'github-policy+supabase-resource-intelligence',
      owner:'ONE BRAIN / Resource & Sustainability Governor',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['all current and future chats','agents','workflows','connected apps','provider usage/pricing evidence']),
      outputs:Object.freeze(['cheapest sufficient route','usage/cost observations','resource optimization candidates','subscription efficiency signals','learning writeback']),
      runtime:Object.freeze({
        policy:'config/brain-cost-policy.json',
        skill:'.agents/skills/powerhouse-resource-sustainability/SKILL.md',
        budgetUsage:'public.brain_budget_usage',
        operationCost:'public.brain_cost_by_operation',
        resourceDaily:'public.powerhouse_resource_intelligence_daily_v1',
        optimizationQueue:'public.powerhouse_resource_optimization_queue_v1',
        resourceImpact:'public.powerhouse_resource_impact_v1'
      }),
      invariants:Object.freeze({
        allConnectorsAutoEnrolled:true,
        universalDefaultForUnknownApps:true,
        cheapestSufficientRoute:true,
        qualityReliabilitySecurityEvidenceFloor:true,
        usageOptimizationAutonomous:true,
        paidPlanChangesRequireHumanApproval:true,
        duplicateCostTruthForbidden:true,
        costPerVerifiedOutcome:true
      })
    }),
    Object.freeze({
      id:'prewrite-obligation-external-mutation-recovery-v1',
      fingerprint:'powerhouse|prewrite-obligation|external-mutation-recovery|v1',
      label:'Pre-write Obligation & External Mutation Recovery',
      authority:'github+supabase+provider-readback',
      owner:'whole-brain-reliability',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['expected outcome','canonical obligation','idempotency key','planned external mutation']),
      outputs:Object.freeze(['durable pre-write checkpoint','same-lineage recovery','terminal readback or hard-boundary evidence']),
      runtime:Object.freeze({
        continuityPolicy:'brain/policies/powerhouse-agent-continuity-v1.json',
        agentContract:'AGENTS.md',
        skill:'.agents/skills/powerhouse-continuity/SKILL.md',
        obligationContract:'docs/outcome-obligations.md',
        contentOrchestrator:'supabase/functions/powerhouse-content-orchestrator/index.ts'
      }),
      invariants:Object.freeze({
        obligationBeforeExternalWrite:true,
        blockedWriteIsRecoverable:true,
        sameIdempotencyLineage:true,
        blogClosesOnProductionReadback:true,
        linkedinCompanyReadAclNotWritePrerequisite:true,
        durableProviderUrnStopsRepublish:true
      })
    }),
    Object.freeze({
      id:'powerhouse-product-led-growth-v1',
      label:'Powerhouse Product-led Growth Architecture',
      authority:'github+public-site+growth-evidence',
      owner:'Powerhouse Growth & Revenue OS',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['public product proposition','existing capabilities','conversion entry points','integration trust','commercial outcomes']),
      outputs:Object.freeze(['single platform narrative','Intelligence product line','Agents product line','Connect product line','free-to-product conversion path']),
      runtime:Object.freeze({homepageBuilder:'tools/site-shell/apply-product-led-home.mjs',skill:'skills/powerhouse-product-led-growth.md',regression:'tests/product-led-home-v1.test.mjs',learning:'brain/learning/2026-09-30-powerhouse-product-led-home-v1.json'}),
      invariants:Object.freeze({onePlatformTaxonomy:true,productBeforeConsultancy:true,freeEntryVisible:true,selfServicePathRequired:true,unverifiedScaleClaimsForbidden:true,bilingualParityRequired:true})
    }),
    Object.freeze({
      id:'predictive-multi-agent-delivery-scheduler-v1',
      label:'Predictive Multi-Agent Delivery Scheduler',
      authority:'github+canonical-delivery-policy',
      owner:'whole-brain-reliability',
      status:'ACTIVE_PROVEN',
      inputs:Object.freeze(['obligation','candidate head','main epoch','changed paths','conflict contracts','mutable resources','active candidates','queue pressure','predicted fan-out']),
      outputs:Object.freeze(['parallel-build decision','canonical writer decision','terminal serialization decision','resumable async checkpoint']),
      runtime:Object.freeze({scheduler:'tools/delivery/predictive-controller.mjs#planConcurrentAgentWork',checkpoint:'POWERHOUSE-ASYNC-CHECKPOINT-v1',policy:'brain/policies/powerhouse-agent-continuity-v1.json'}),
      productionEvidence:Object.freeze({mergeSha:'c2188fde24f7d51c194acd1c7c0d093b7ceb316e',requiredTest:'success',skillProjection:'success',canonicalTerminalizerRunId:36696171917,canonicalTerminalizerConclusion:'success',productionMode:'MAIN_CONTAINMENT_NON_RUNTIME'}),
      invariants:Object.freeze({oneObligationOneWriter:true,nonConflictingParallelBuild:true,serializeOnlyTerminalOverlap:true,predictFanoutBeforeWrite:true,remoteWaitNeverMeansStop:true,terminalCandidateImmutableAfterLease:true,branchMutationCompareAndSwap:true,staleEpochCreatesSuccessor:true})
    }),
    Object.freeze({
      id:'async-delivery-continuation-v1',
      label:'Async Delivery Continuation & Queue Supersession',
      authority:'github+powerhouse-canonical-checkpoint',
      owner:'whole-brain-reliability',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['open obligation','exact candidate head','current main epoch','GitHub/Netlify/Supabase workflow state']),
      outputs:Object.freeze(['resumable checkpoint','deduplicated required runs','bounded polling','stale reversible run supersession']),
      runtime:Object.freeze({
        policy:'brain/policies/powerhouse-agent-continuity-v1.json',
        agentContract:'AGENTS.md',
        skill:'.agents/skills/powerhouse-continuity/SKILL.md',
        productionSnapshot:'.github/workflows/production-source-snapshot.yml',
        netlifyApplicability:'tools/delivery/netlify-deployment-applicability.mjs',
        productionTransportLearning:'brain/learning/2026-10-07-netlify-native-git-primary-authority-v1.json',
        productionTransportRegression:'tests/brain-netlify-git-deploy-first-v1.test.mjs',
        productionFallbackLearning:'brain/learning/netlify-oidc-proxy-401-git-source-fallback-20260925-v1.json',
        productionFallbackRegression:'tests/brain-netlify-proxy-auth-self-heal-v2.test.mjs',
        requiredGate:'.github/workflows/required-test.yml',
        recoverySupervisor:'.github/workflows/powerhouse-delivery-recovery-supervisor.yml',
        terminalClosure:'.github/workflows/obligation-terminal-closure.yml',
        learningProjectionDescendantProof:Object.freeze({
          authority:'Powerhouse Skill Projection on protected main',
          historicalFailureNeverRelabeledGreen:true,
          successfulDescendantWorkflowRequired:true,
          originalMergeAndCurrentMainAncestryRequired:true,
          learningBlobParityRequired:true,
          regression:'tests/brain-source-universe-learning-projection-v1.test.mjs'
        }),
        learning:'brain/learning/2026-09-30-async-workflow-continuation-v1.json'
      }),
      invariants:Object.freeze({
        remoteWaitNeverMeansAgentIdle:true,
        duplicateRequiredRunForbidden:true,
        boundedPollingRequired:true,
        checkpointBeforeWait:true,
        requiredOnlyOpenPrRecovery:true,
        staleReversibleProductionWaitSupersededByNewerMain:true,
        netlifyNativeGitPrimary:true,
        netlifyJitBridgeFallbackOnly:true,
        netlifyLinkedBuildTriggerRetired:true,
        netlify401ReacquiresFreshOidcAndProxy:true,
        netlifyAuthRetryBounded:true,
        nonAuthTransportFailureFailClosed:true,
        exactShaReadbackAfterRecovery:true,
        mergedPrBodyForwardingRequired:true,
        netlifyDeploymentApplicabilityShared:true,
        nonNetlifyBackendSkipsNetlifyMutation:true,
        supabaseOnlySkipsNetlifyMutation:true
      })
    }),
    Object.freeze({
      id:'ai-model-intelligence-advisor-v1',
      label:'AI Model Intelligence & Advisor',
      authority:'github+official-provider-evidence+supabase-commercial-outcomes',
      owner:'Powerhouse Growth & Revenue OS / whole-brain-intelligence',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['official provider model/pricing/lifecycle/governance evidence','plain-language business outcome','one-off vs recurring cadence','number of users/employees','estimated workload volume','data sensitivity','error impact','integration pattern','budget','cost/latency/quality priority','privacy/residency/sovereignty constraints']),
      outputs:Object.freeze(['explainable model shortlist','task-cost estimate','multi-model routing recommendation','qualified lead context','model-intelligence learning']),
      runtime:Object.freeze({providerGovernance:'data/ai-provider-governance-v1.json',
        catalog:'data/ai-model-catalog-v1.json',
        policy:'config/powerhouse-ai-model-intelligence-v1.json',
        publicSurface:'/ai-modelwijzer',
        leadFunction:'netlify/functions/ai-modelwijzer-lead.mjs',
        skill:'.agents/skills/powerhouse-ai-model-intelligence/SKILL.md',
        learning:'brain/learning/2026-09-30-powerhouse-ai-model-advisor-v1.json',
        regression:'tests/ai-model-advisor-v1.test.mjs',
        dailyAudit:'scripts/brain/ai-model-intelligence-audit.mjs',
        dailyWorkflow:'.github/workflows/powerhouse-daily-self-evolution.yml'
      }),
      invariants:Object.freeze({
        userGoalFirst:true,
        noUniversalBestModelClaim:true,
        dataResidencyIsNotSovereignty:true,
        storageAndInferenceResidencySeparated:true,
        providerJurisdictionExplicit:true,
        officialSourceFirst:true,
        unknownIsNotGuaranteed:true,
        valueBeforeLeadGate:true,
        noParallelLeadStore:true,
        qualifiedLeadToRevenueLoop:true,
        protectedDeliveryAndProductionReadbackRequired:true,
        specialistIntentGate:true,
        explicitLimitationsRequired:true,
        modalityAndTaskFiltersRequired:true,
        perModelVerificationDateRequired:true,
        governanceUnknownNeverGreen:true,
        broadSpecialistCoverage:true,
        falconOpenWeightCoverageRequired:true,
        noviceOutcomeFirstWizard:true,
        unknownAnswerStillActionable:true,
        employeeAndCadenceScaleCost:true,
        errorImpactDrivesHumanControl:true,
        plainLanguageRecommendationRequired:true
      })
    }),
    Object.freeze({
      id:'social-story-family-uniqueness-v6',
      label:'Social Historical Story-Family Uniqueness v6',
      authority:'supabase',
      owner:'social-publication-authority',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['final social candidate','retained publication history','canonical story fingerprint','meaningful-keyword set']),
      outputs:Object.freeze(['UNIQUE_RESERVED','STORY_FAMILY_DUPLICATE','provider-write fence']),
      runtime:Object.freeze({
        reservation:'public.powerhouse_reserve_unique_publication_v1',
        backstop:'public.powerhouse_publication_story_family_guard_v2',
        history:'public.powerhouse_publication_uniqueness_v1',
        publisher:'supabase/functions/powerhouse-social-publisher/index.ts',
        skill:'.agents/skills/linkedin-composio-publisher/SKILL.md',
        personalSkill:'.agents/skills/personal-linkedin-life-only/SKILL.md',
        regression:'tests/brain-social-duplicate-prevention-governance-v1.test.mjs',
        learning:'brain/learning/2026-09-30-social-story-family-dedupe-v6.json'
      }),
      productionEvidence:Object.freeze({
        escapedDefect:'2026-09-24 vs 2026-09-30 personal LinkedIn car/sliding-door/airco story',
        sharedMeaningfulKeywords:16,
        priorJaccardApprox:0.165,
        observedOverlapAgainstSmallerStoryApprox:0.372,
        paraphraseRegressionBlocked:true,
        regressionResult:'STORY_FAMILY_DUPLICATE',
        observedAt:'2026-09-30T07:15:00+02:00'
      }),
      invariants:Object.freeze({
        databaseEnforced:true,
        applicationBypassForbidden:true,
        storyRewriteIsNotNovelty:true,
        overlapCoefficientGate:true,
        userReportedDuplicateBecomesRegression:true,
        consumedStoryFamilyNeverReactivatedByRewording:true
      })
    }),
    Object.freeze({
      id:'portal-v2-experience-contract-v1',
      label:'Portal V2 Responsive Experience & Reliability Contract',
      authority:'github+netlify+portal-state-readback',
      owner:'Powerhouse Product / Portal V2',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['Portal V2 page registry','canonical navigation','dynamic page content','Portal State','runtime evidence']),
      outputs:Object.freeze(['consistent responsive scale','bounded charts and media','accessible interactions','viewport-safe flows','backend contract regression evidence']),
      runtime:Object.freeze({
        css:'portal-v2/experience.css',
        client:'portal-v2/experience.js',
        documentation:'docs/changes/2026-10-04-portal-v2-experience-contract-v1.md',
        learning:'brain/learning/2026-10-04-portal-v2-experience-contract-v1.json',
        regression:'tests/portal-v2-experience-contract.test.mjs',
        backendAuthority:'portal-v2/portal-state.js'
      }),
      invariants:Object.freeze({
        oneExperienceLayer:true,
        singleNavigationAuthority:true,
        minTouchTargetPx:44,
        horizontalOverflowForbidden:true,
        responsiveChartContainment:true,
        responsiveMediaContainment:true,
        visibleKeyboardFocus:true,
        reducedMotionSupported:true,
        portalStateAuthorityUnchanged:true,
        failClosedWrites:true,
        productionReadbackRequired:true
      }),
      productionEvidence:Object.freeze({
        deliveryPr:3683,
        candidateHead:'a21b9b961bedf9840a69fad5ff9059c8f6643196',
        protectedMain:'d5abf46b5f86a65720fd2cf2d454116f696e8c45',
        netlifyDeploy:'6ac253953b573d0008e8e31a',
        productionUrl:'https://www.bedrijfsgeheugen.nl/portaal',
        technicalReadbackUrl:'https://www.bedrijfsgeheugen.nl/portal-v2/',
        productionState:'ready',
        requiredTestRun:37205339277,
        productionDomReadbackRun:37205339123,
        visualDensityRun:37205339124,
        codeqlRun:37205339174,
        terminalClosureRun:37205519609,
        terminalState:'LIVE_BEWEZEN'
      })
    }),
    Object.freeze({
      id:'portal-authenticated-production-proof-v1',
      label:'Portal Authenticated Production Proof',
      authority:'netlify-deploy-event+netlify-identity+immutable-production-readback',
      owner:'Powerhouse Delivery / Portal',
      status:'PRODUCTION_REPAIR_PENDING',
      inputs:Object.freeze(['production deploy identity','ephemeral Netlify Identity user','serverless runtime credentials']),
      outputs:Object.freeze(['authenticated Portal HTTP proof receipt','tenant-scope proof','payload-shape proof','synthetic-user cleanup proof']),
      implementation:Object.freeze({
        core:'platform/api/portal-authenticated-production-proof-core.mjs',
        deployEvent:'netlify/functions/portal-authenticated-production-proof.mjs',
        receiptReadback:'netlify/functions/portal-authenticated-production-proof-readback.mjs',
        protectedApi:'netlify/functions/portal-ondernemersdata.mjs',
        workflow:'.github/workflows/production-release-readback.yml',
        regression:'tests/portal-authenticated-production-proof.test.mjs',
        canonicalLearning:'brain/learning/2026-10-07-portal-authenticated-production-proof-v1.json',
        repairLearning:'brain/learning/2026-10-07-portal-authenticated-production-503-serverless-env-v1.json'
      }),
      invariants:Object.freeze({
        realNetlifyIdentityJwt:true,
        exactImmutableDeploy:true,
        tenantScopeVerified:true,
        payloadShapeVerified:true,
        syntheticUserDeletedBeforeGreen:true,
        noCredentialPersistence:true,
        serverlessSecretsUseProcessEnv:true,
        productionReadbackRequired:true,
        failClosed:true
      }),
      productionEvidence:Object.freeze({
        lastAttemptSha:'e30cf09cf7a1f0bddffd334e191fcb0c2021b7ea',
        lastAttemptDeploy:'6ac6b2bc943e4e00084ffce2',
        lastAttemptRun:37686181317,
        lastAttemptStatus:'FAILED',
        lastAttemptFailure:'AUTHENTICATED_PORTAL_API_HTTP_503',
        repairStatus:'PENDING_PROTECTED_DELIVERY'
      })
    }),
    Object.freeze({
      id:'portal-v2-powerhouse-e2e-runtime-v1',
      label:'Portal V2 ↔ Powerhouse End-to-End Runtime',
      authority:'netlify-identity+netlify-api+supabase-brain-authority',
      owner:'Powerhouse Product / Portal V2 / Whole Brain',
      status:'CANDIDATE_PROTECTED_DELIVERY',
      inputs:Object.freeze(['authenticated Portal V2 session','customer source mutations','Brain operating projection','decision and intelligence interactions']),
      outputs:Object.freeze(['canonical tenant-scoped Brain records','same-lineage interaction evidence','canonical REQUESTED action intents','derived portal.runtime projection','post-mutation runtime refresh']),
      runtime:Object.freeze({
        portalState:'portal-v2/portal-state.js',
        domainState:'portal-v2/domain-state.js',
        bridge:'portal-v2/powerhouse-runtime-bridge.js',
        readback:'portal-v2/runtime-evidence.js',
        brainApi:'netlify/functions/brain-operating-loop.mjs',
        portalInputApi:'netlify/functions/portal-business-input.mjs',
        canonicalAuthority:'supabase/functions/brain-operating-authority',
        portalProjection:'supabase/functions/portal-state-eu',
        learning:'brain/learning/2026-10-04-portal-powerhouse-e2e-runtime-v1.json',
        regression:'tests/brain-portal-v2-end-to-end-runtime.test.mjs',
        actionIntentRegression:'tests/brain-portal-action-intent-e2e.test.mjs'
      }),
      invariants:Object.freeze({
        authenticatedBrainReadback:true,
        tenantResolvedServerSide:true,
        sourceMutationToCanonicalBrain:true,
        sourceRevisionCorrelationAuthority:true,
        derivedRuntimeNeverPersistsAsSource:true,
        interactionEvidenceBounded:true,
        actionIntentBecomesCanonicalBrainAction:true,
        requestedActionIsNotExecution:true,
        refreshAfterMaterialMutation:true,
        noParallelBrain:true,
        noParallelPortalStore:true,
        failClosedWithoutEvidence:true,
        productionReadbackRequired:true
      })
    }),
    Object.freeze({
      id:'portal-v2-nextgen-intelligence-v1',
      label:'Portal V2 Next-gen Intelligence & Future Lens',
      authority:'portal-v2+brain-learning+production-readback',
      owner:'Powerhouse Product / Portal V2',
      status:'CANDIDATE',
      inputs:Object.freeze(['visible portal KPIs','visible trend deltas','Portal V2 visual models','company context and evidence']),
      outputs:Object.freeze(['explainable Future Lens','bounded scenario projection','confidence and assumptions','context inspector','insight-to-action handoff']),
      runtime:Object.freeze({
        css:'portal-v2/nextgen-intelligence.css',
        client:'portal-v2/nextgen-intelligence.js',
        documentation:'docs/changes/2026-10-04-portal-v2-nextgen-intelligence.md',
        learning:'brain/learning/2026-10-04-portal-v2-nextgen-intelligence.json',
        ledger:'docs/development-ledger-events/2026-10-04-portal-v2-nextgen-intelligence.md',
        regression:'tests/brain-portal-v2-nextgen-intelligence.test.mjs'
      }),
      invariants:Object.freeze({
        evidenceFirst:true,
        hiddenDataClaimsForbidden:true,
        falsePrecisionForbidden:true,
        confidenceBelowCertainty:true,
        directActionPath:true,
        touchFirst:true,
        reducedMotionSupported:true,
        singlePortalExperience:true,
        productionReadbackRequired:true
      }),
      productionEvidence:Object.freeze({
        deliveryPr:3700,
        terminalState:'CANDIDATE'
      })
    }),
    Object.freeze({
      id:'portal-v2-experience-contract-v2',
      label:'Portal V2 Responsive Experience & Reliability Contract v2',
      authority:'github+netlify+portal-state-readback',
      owner:'Powerhouse Product / Portal V2',
      status:'LIVE_PROVEN_RUNTIME',
      supersedes:'portal-v2-experience-contract-v1',
      inputs:Object.freeze(['live v1 experience authority','Portal V2 page registry','dynamic visuals','browser metrics','Portal State']),
      outputs:Object.freeze(['24-case responsive evidence','320px narrow-mobile coverage','runtime interaction/error signals','visual overflow evidence','touch-target evidence']),
      runtime:Object.freeze({
        css:'portal-v2/experience.css',
        client:'portal-v2/experience.js',
        contract:'config/powerhouse-portal-experience-v2.json',
        visualAssurance:'config/powerhouse-portal-visual-assurance-v1.json',
        harness:'tools/portal-visual-density.mjs',
        learning:'brain/learning/2026-10-04-portal-v2-experience-contract-v2.json',
        regression:'tests/portal-v2-experience-contract.test.mjs',
        backendAuthority:'portal-v2/portal-state.js'
      }),
      invariants:Object.freeze({
        singleExperienceAuthority:true,
        parallelExperienceStackForbidden:true,
        minTouchTargetPx:44,
        maxHorizontalOverflowPx:2,
        maxVisualOverflowPx:2,
        narrowMobile320FirstClass:true,
        screenshotMatrix:24,
        runtimeExperienceSignals:true,
        dynamicVisualRemeasurement:true,
        portalStateAuthorityUnchanged:true,
        failClosedWrites:true,
        productionReadbackRequired:true
      }),
      productionEvidence:Object.freeze({
        deliveryPr:3692,
        candidateHead:'f74198342ad38217698c914933e1e81502f518f0',
        protectedMain:'392ec658131c01824712d83c83e41d36a3633575',
        netlifyDeploy:'6ac25d5a4e893200088ae19b',
        productionUrl:'https://www.bedrijfsgeheugen.nl/portaal',
        technicalReadbackUrl:'https://www.bedrijfsgeheugen.nl/portal-v2/',
        productionState:'ready',
        requiredTestRun:37207574172,
        productionDomReadbackRun:37207574039,
        visualDensityRun:37207574040,
        codeqlRun:37207574054,
        skillProjectionRun:37208029113,
        terminalClosureRun:37208029345,
        terminalState:'LIVE_BEWEZEN'
      })
    }),
    Object.freeze({
      id:'linkedin-company-growth-v1',
      label:'LinkedIn Company Page Growth Loop',
      authority:'supabase+provider-readback',
      owner:'Powerhouse Growth & Revenue OS',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['company-page analytics','linkedin_company posts','observed social metrics','owned-site and revenue outcomes']),
      outputs:Object.freeze(['distribution-gap diagnosis','bounded company-content recommendations','page/follower progress','revenue-learning evidence']),
      runtime:Object.freeze({
        policy:'config/linkedin-company-growth-v1.json',
        refresh:'public.powerhouse_refresh_linkedin_company_growth_v1(date)',
        pageMetrics:'public.powerhouse_linkedin_company_page_metrics_v1',
        dailyState:'public.powerhouse_linkedin_company_growth_daily_v1',
        recommendations:'public.powerhouse_content_recommendations',
        schedulerOwner:'public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)',
        skill:'.agents/skills/powerhouse-linkedin-company-growth/SKILL.md',
        learning:'brain/learning/2026-10-04-linkedin-company-page-growth-v1.json',
        regression:'tests/brain-linkedin-company-growth-engine-v1.test.mjs'
      }),
      productionEvidence:Object.freeze({
        baselineObservedAt:'2026-10-04T13:11:00+02:00',
        baselinePageViews:12,
        baselineDesktop:10,
        baselineMobile:2,
        targetPageViews30d:300,
        targetRelevantNewFollowers30d:100,
        protectedMain:'6d9770aad32289d000f209d9ea54c72ed5511b73',
        deliveryPr:3674,
        runtimeObservedAt:'2026-10-04T11:46:48.64111Z',
        runtimeStatus:'GROW',
        diagnosis:'critical_distribution_gap',
        targetProgress:0.04,
        companyPosts30d:12,
        observedImpressions30d:31,
        observedReach30d:21,
        recommendationsTouched:3,
        canonicalCronJobId:116,
        canonicalCronSchedule:'27 * * * *',
        notionSystemMapReadback:true,
        notionHumanHandbookReadback:true,
        notionMasterRegisterReadback:true
      }),
      invariants:Object.freeze({
        canonicalOrganizationUrn:'urn:li:organization:18234216',
        oneCommercialScheduler:true,
        maxCompanyPostsPerDay:1,
        maxGrowthRecommendationsPerDay:3,
        personalLinkedinCommercialBridgeForbidden:true,
        duplicateGateRequired:true,
        sourceBackedRequired:true,
        providerReadbackRequired:true,
        vanityMetricsNotTerminal:true,
        revenueNorthStar:true
      })
    }),
    Object.freeze({
      id:'source-backed-outbound-loop-v1',
      label:'Powerhouse Source-backed Outbound Loop',
      authority:'supabase+provider-readback',
      owner:'Powerhouse Growth & Revenue OS',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['public problem signals','SEO/search intent','verified personal truth','account/company triggers','relationship context','reply learning']),
      outputs:Object.freeze(['channel-native candidates','source-gated email/LinkedIn DM','provider-linked publication/send evidence','outcome/learning writeback']),
      runtime:Object.freeze({
        contract:'config/powerhouse-source-backed-channel-contract-v1.json',
        sourceLineage:'public.powerhouse_outbound_source_lineage_v1',
        materializer:'public.powerhouse_materialize_source_backed_channel_candidates_v1(date)',
        sourceGate:'public.powerhouse_require_source_for_direct_outreach_v1()',
        lineageRefresh:'public.powerhouse_refresh_outbound_source_lineage_v1(date)',
        orchestrator:'supabase/functions/powerhouse-content-orchestrator/index.ts',
        channels:Object.freeze(['linkedin_personal','linkedin_company','blog','email','linkedin_dm','instagram_company'])
      }),
      productionEvidence:Object.freeze({
        orchestratorVersion:29,
        lineageRefreshVerified:true,
        refreshedLineages:61,
        tomorrowLinkedinCompanySourceBacked:true,
        tomorrowBlogSourceBacked:true,
        directOutreachSourceGateActive:true,
        instagramSourceRadarSignals:24,
        instagramSourceRadarEligible:12,
        observedAt:'2026-09-29T19:10:00Z'
      }),
      invariants:Object.freeze({
        staticCalendarFallbackOnly:true,
        channelNativeTransformation:true,
        inventedPersonalExperienceForbidden:true,
        directOutreachRequiresTraceableTrigger:true,
        directOutreachRequiresPersonOrCompanyContext:true,
        providerReadbackRequired:true,
        outcomeLearningRequired:true,
        sameSourceLineagePreserved:true
      })
    }),
    Object.freeze({
      id:'instagram-live-provider-identity',
      label:'Instagram Live Provider Identity',
      authority:'composio-provider-readback',
      owner:'social-publication-authority',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['active Instagram connections','INSTAGRAM_GET_USER_INFO(me)','canonical username bedrijfsgeheugen.nl']),
      outputs:Object.freeze(['verified providerUserId','BUSINESS/CREATOR identity','create→publish→readback binding']),
      runtime:Object.freeze({
        publisher:'supabase/functions/powerhouse-social-publisher/index.ts',
        contract:'config/instagram-canonical-provider-identity-v3.json',
        skill:'.agents/skills/instagram-composio-publisher/SKILL.md',
        learning:'brain/learning/2026-09-29-instagram-provider-id-drift-v3.json'
      }),
      productionEvidence:Object.freeze({
        username:'bedrijfsgeheugen.nl',
        accountType:'BUSINESS',
        providerNodeId:'28537384955950341',
        observedGraphUserId:'17841446582493753',
        liveMediaId:'18105956765257858',
        livePermalink:'https://www.instagram.com/reel/Dd4MOdTEarq/',
        providerReadback:true,
        observedAt:'2026-09-29T16:29:48Z',
        edgeFunctionVersion:84,
        protectedMain:'8288b2ab5c6d7caa75a0e199d0273386776a66c2',
        directProviderReadback:true
      }),
      invariants:Object.freeze({
        hardcodedProviderUserIdForbidden:true,
        nodeIdDistinctFromGraphUserId:true,
        liveProviderIdentityBeforeSideEffect:true,
        liveGraphUserIdIsRuntimeAuthority:true,
        sameProviderUserIdForCreatePublishReadback:true,
        sameDailyClaimOnDrift:true
      })
    }),
    Object.freeze({
      id:'email-reply-revenue-learning-v1',
      label:'Commercial Email Reply → Revenue Learning',
      authority:'gmail+supabase',
      owner:'Powerhouse Growth & Revenue OS / powerhouse-commercial-learning-v1',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['executed autonomous email actions','Gmail provider readback','inbound replies','sales outcomes','realized revenue']),
      outputs:Object.freeze(['reply classification','suppression or deduplicated follow-up','sales outcome','revenue-first learning','next-best-action calibration']),
      runtime:Object.freeze({
        replies:'public.powerhouse_email_reply_events',
        suppressions:'public.powerhouse_email_contact_suppressions',
        learning:'public.powerhouse_email_learning_stats',
        learningRefresh:'public.powerhouse_refresh_email_learning_stats()',
        outboundGuard:'public.powerhouse_email_suppression_guard_v1',
        canonicalOwner:'Powerhouse Growth & Revenue OS',
        skill:'.agents/skills/powerhouse-relationship-revenue/SKILL.md'
      }),
      productionEvidence:Object.freeze({
        gmailReadbackVerified:true,
        replyEventsVerified:2,
        didTelecomClass:'objection_need',
        didTelecomSuppressed:true,
        techFestivalClass:'objection_timing',
        techFestivalNurture:true,
        parallelReplyCronCount:0,
        runtimeReadbackAt:'2026-09-29T14:59:12.875008Z'
      }),
      invariants:Object.freeze({
        sentIsNotTerminal:true,
        providerMessageIdIdempotency:true,
        suppressionBeforeSideEffect:true,
        noDuplicateFollowup:true,
        revenueFirstOptimization:true,
        noParallelReplyScheduler:true,
        noParallelCrmOrLearningStore:true,
        cycleGuardNotWeakened:true
      })
    }),
    Object.freeze({
      id:'green-assurance-v1',
      label:'Powerhouse Truthful Green Assurance',
      authority:'supabase+github+provider-readback',
      owner:'whole-brain-reliability',
      status:'ACTIVE_FAIL_CLOSED',
      inputs:Object.freeze(['runtime health','terminal control-plane health','required evidence coverage','open obligations','provider readback','outcome evidence']),
      outputs:Object.freeze(['root-cause repair','recomputed health','provider-neutral failover state','learning/skill/agent/docs/System Map writeback']),
      runtime:Object.freeze({
        oneBrainHealth:'public.powerhouse_one_brain_runtime_health_v1',
        terminalHealth:'public.powerhouse_terminal_control_plane_health_v1',
        evidenceHealth:'public.powerhouse_evidence_operating_health_v3',
        sourceCoverage:'public.powerhouse_evidence_source_coverage_v1',
        skill:'.agents/skills/powerhouse-green-assurance/SKILL.md',
        learning:'brain/learning/2026-09-29-powerhouse-green-assurance-v1.json',
        truthContract:'config/powerhouse-truth-status-contract.json'
      }),
      productionEvidence:Object.freeze({
        productionMain:'204269314239ea2cc56a00a0da1ed87a5056415f',
        netlifyDeployId:'6abbdf73c4c7d80008d9811f',
        netlifyState:'ready',
        netlifyContext:'production',
        writebackLearning:'brain/learning/2026-09-29-live-assurance-writeback-v1.json',
        livePromotionGovernanceClosure:'brain/learning/2026-09-29-live-promotion-governance-closure-v1.json',
        liveVsFunctionalTruthLearning:'brain/learning/2026-09-29-live-ready-vs-functional-green-v1.json',
        observedReadyDeploy:Object.freeze({
          deployId:'6abbdf73c4c7d80008d9811f',
          commitRef:'204269314239ea2cc56a00a0da1ed87a5056415f',
          state:'ready',
          context:'production',
          publishedAt:'2026-09-29T15:57:21.591Z'
        })
      }),
      invariants:Object.freeze({
        wiringIsNotGreen:true,
        staleIsNotGreen:true,
        unknownIsNotGreen:true,
        providerAckIsNotOutcome:true,
        providerNeutralFailover:true,
        retiredToolingTelemetryOnly:true,
        noDuplicateRepublish:true,
        instagramMiraExactProofRequired:true,
        recomputeAfterRepair:true,
        canonicalWritebackRequired:true,
        liveAssuranceWriteback:true,
        freshReadbackRequiredForCurrentGreen:true,
        livePromotionGovernanceClosure:true,
        readyDeployIsOnlyDeploymentEvidence:true,
        capabilitySubchainsIndependentlyGated:true,
        deploymentReadyNeverImpliesFunctionalGreen:true,
        deploymentAndCapabilityTruthSeparated:true
      })
    }),
    Object.freeze({
      id:'daily-compound-learning',
      label:'Powerhouse Daily Compound Learning',
      authority:'supabase+github',
      owner:'whole-brain-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['verified runtime events','executed actions','existing Outcome Memory','commercial-progression forecasts','forecast calibration']),
      outputs:Object.freeze(['verified outcomes','action-outcome linkage','forecast resolutions','calibration evidence','daily compound-learning control state']),
      runtime:Object.freeze({
        outcomeCandidates:'public.powerhouse_verified_outcome_candidates_v1',
        capture:'public.powerhouse_capture_verified_outcomes_v1(date)',
        forecastCandidates:'public.powerhouse_forecast_resolution_candidates_v3',
        resolver:'public.powerhouse_resolve_forecasts_from_outcomes_v3()',
        control:'public.powerhouse_daily_compound_learning_control_v1',
        orchestrator:'public.powerhouse_run_daily_compound_learning_v1(date)',
        cron:'50 2 * * *',
        wholeBrainDaily:'.github/workflows/whole-brain-canonical-loop-v2.yml',
        universalLearningDaily:'.github/workflows/universal-closed-loop-learning.yml',
        agentContract:'AGENTS.md',
        chatLearningContract:'config/brain-chat-learning-contract.json',
        continuitySkill:'.agents/skills/powerhouse-continuity/SKILL.md'
      }),
      productionEvidence:Object.freeze({
        migrationAppliedVersion:'20260929084144',
        outcomesBefore:6,
        salesOutcomesAfter:24,
        outcomeMemoryAfter:30,
        insertedOutcomes:18,
        actionsLinked:3,
        executedActionOutcomeCoverage:0.4615,
        forecastsTotal:1223,
        forecastsResolved:3,
        forecastResolutionDebt:0,
        runtimeReadbackAt:'2026-09-29T08:41:57Z'
      }),
      invariants:Object.freeze({
        verifiedOutcomesOnly:true,
        testAndSyntheticEvidenceExcluded:true,
        noInventedRevenue:true,
        silenceIsNotNegativeOutcome:true,
        noParallelOutcomeStore:true,
        noParallelForecastStore:true,
        nextDecisionMustConsumeLearning:true,
        wholeBrainIntegrityDaily:true,
        universalClosedLoopDaily:true,
        inheritedByAllChatsAgentsSkills:true,
        chatLearningPreflightRequired:true,
        agentContractRequired:true,
        nextAgentDiscoverabilityRequired:true
      })
    }),
    Object.freeze({
      id:'self-improvement-layer',
      label:'Powerhouse Self-Improvement Layer',
      authority:'supabase',
      owner:'whole-brain-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['Company Intelligence OS','verified Outcome Memory','optimization candidates','quality events','model health','autonomous-improvement evidence','engineering evidence']),
      outputs:Object.freeze(['agent objective registry','learning compiler queue','self-improvement control state','provider-neutral model routing policy','architecture health','controlled promotion recommendations']),
      runtime:Object.freeze({
        control:'public.powerhouse_self_improvement_control_v1',
        learningQueue:'public.powerhouse_learning_compiler_queue_v1',
        agentObjectives:'public.powerhouse_agent_objective_registry_v1',
        orchestrator:'public.powerhouse_run_self_improvement_layer_v1(date)',
        module:'brain/self-improvement/self-improvement-layer.mjs',
        contract:'brain/contracts/self-improvement-layer-v1.json',
        dailyWorkflow:'.github/workflows/powerhouse-daily-self-evolution.yml'
      }),
      productionEvidence:Object.freeze({
        githubImplementationMergeSha:'9feaa95a77e7bc24c53ffd852058fe56de02c67d',
        githubRuntimeHardeningMergeSha:'26199abfb2accb3a015c45490f8e0da9e4e32d47',
        initialMigrationName:'powerhouse_self_improvement_layer_v1',
        initialMigrationSourceVersion:'20260928194500',
        initialMigrationAppliedVersion:'20260928182014',
        hardeningMigrationName:'powerhouse_self_improvement_orchestrator_nonblocking_v1',
        hardeningMigrationSourceVersion:'20260928203000',
        hardeningMigrationAppliedVersion:'20260928183018',
        agentObjectives:6,
        compilerReady:8,
        compilerEvidencePending:0,
        compilerRegressionPending:0,
        escapedDefectsWithoutRegression:0,
        modelHealthDegraded:0,
        modelHealthUnknown:0,
        learningCompanies:5,
        verifiedOutcomes:5,
        runtimeEvents:1,
        dailyCron:'7 3 * * *',
        duplicateOrchestration:false,
        newSecurityAdvisorFindings:0,
        newPerformanceAdvisorFindings:0,
        runtimeReadbackAt:'2026-09-28T18:30:25.114667Z'
      }),
      invariants:Object.freeze({
        noLearningWithoutEvidence:true,
        noChangeWithoutEvaluation:true,
        noDeploymentWithoutRegressionProof:true,
        noIntelligenceWithoutMeasurableOutcome:true,
        noUncontrolledSelfModification:true,
        unknownIsNotGreen:true,
        noParallelLearningStore:true,
        protectedDeliveryReused:true
      })
    }),
    Object.freeze({
      id:'foresight-prediction-intelligence-v2',
      label:'Powerhouse Foresight & Prediction Intelligence v2',
      authority:'supabase',
      owner:'whole-brain-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['Company Graph','predictive signals','external signals','operating outcomes','forecast history','forecast calibration']),
      outputs:Object.freeze(['calibrated forecasts','scenario ensembles','leading indicators','prediction quality','resolution debt','bounded prediction improvement challengers']),
      runtime:Object.freeze({
        forecasts:'public.powerhouse_forecasts',
        signals:'public.powerhouse_predictive_signals',
        calibration:'public.powerhouse_forecast_calibration',
        quality:'public.powerhouse_forecast_quality_v2',
        resolutionDebt:'public.powerhouse_forecast_resolution_debt_v2',
        control:'public.powerhouse_prediction_intelligence_control_v2',
        improvementQueue:'public.powerhouse_prediction_improvement_queue_v2',
        audit:'public.powerhouse_prediction_learning_audit_v2()',
        brain:'scripts/brain/foresight-autonomy.mjs',
        portal:'portal-v2/foresight-intelligence.js',
        contextualPortal:'portal-v2/foresight-context-ui.js',
        predictionQualityApi:'netlify/functions/portal-prediction-intelligence.mjs',
        selfImprovementControl:'public.powerhouse_self_improvement_control_v1',
        contextualVisuals:Object.freeze(['goal forecasts','scenario uncertainty','prediction quality','compound intelligence loop','self-improvement evidence'])
      }),
      productionEvidence:Object.freeze({
        githubMergeSha:'16a15a7ae0c13a3a626c2fedba498c46123ba5c2',
        migrationName:'powerhouse_foresight_prediction_intelligence_v2',
        forecastTotal:1177,
        forecastsDue:3,
        resolvedTotal:3,
        resolutionDebt:0,
        brierScore:0.1092,
        calibrationError:0.3297,
        timingMaeDays:8.9,
        signalTotal:143,
        independentSourceTypes:3,
        topics:16,
        statisticallyUsableBuckets:0,
        predictionState:'CALIBRATION_DEGRADED',
        auditCron:'35 6 * * *',
        predictiveEngineCron:'8 6 * * *',
        calibratorCron:'50 * * * *',
        runtimeReadbackAt:'2026-09-28T18:45:25Z',
        contextualPortalLive:true,
        contextualPortalMergeSha:'6a5e27df02e8cb5d43df7dce38b4094e9180f1af',
        contextualPortalProductionDeploySha:'602973dace20523c20f0b656713243c5c6408f72',
        productionReleaseReadback:'success',
        portalDomReadback:'success'
      }),
      invariants:Object.freeze({
        predictionIsNotFact:true,
        noParallelForecastStore:true,
        unresolvedForecastsAreLearningDebt:true,
        brierAndCalibrationRequired:true,
        horizonSpecificLearning:true,
        scenarioEnsembleForMaterialForecasts:true,
        directSelfRewriteForbidden:true,
        protectedPromotionRequired:true,
        contextualDecisionVisibilityRequired:true
      })
    }),
    Object.freeze({
      id:'company-intelligence-os',
      label:'Powerhouse Company Intelligence OS',
      authority:'supabase',
      owner:'whole-brain-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['canonical source evidence','CRM/relationship evidence','company/people graph','opportunities','actions','provider readback','outcomes','realized value']),
      outputs:Object.freeze(['Company Graph','System of Context','autonomous action candidates','Outcome Memory','compound intelligence next-decision context']),
      runtime:Object.freeze({
        graphNodes:'public.powerhouse_company_graph_nodes_v1',
        graphEdges:'public.powerhouse_company_graph_edges_v1',
        context:'public.powerhouse_system_of_context_v1',
        actionLayer:'public.powerhouse_autonomous_action_layer_v1',
        outcomeMemory:'public.powerhouse_outcome_memory_v1',
        compoundIntelligence:'public.powerhouse_compound_intelligence_v1',
        brainModule:'brain/company-intelligence/company-intelligence-os.mjs',
        contract:'brain/contracts/company-intelligence-os-v1.json',
        orchestrator:'public.powerhouse_run_company_intelligence_os_v1(date)',
        portalProjection:'portal-v2/operating-system/company-intelligence-context.js',
        portalStyles:'portal-v2/company-intelligence-context.css'
      }),
      productionEvidence:Object.freeze({
        githubMainMergeSha:'f177340af3aa08287cc510915623e01ce701778d',
        migrationName:'powerhouse_company_intelligence_os_v1',
        migrationExpectedVersion:'20260928193000',
        migrationAppliedVersion:'20260928175205',
        migrationMatchMode:'UNIQUE_NAME_RECONCILED',
        graphNodes:42217,
        graphEdges:25164,
        companiesInContext:17328,
        actions:2883,
        outcomeMemories:30,
        compoundCompanies:17328,
        runtimeReadbackAt:'2026-09-28T17:54:27Z',
        portalContextualProjectionMergeSha:'0b4547f33a74ce911a0d324a53404cff1cc6e737',
        portalTenantIsolationEvalMergeSha:'764a7387e1852e7c1e8700efc443d29870221f39',
        portalNetlifyDeployId:'6abac41210b244000884a323',
        portalNetlifyCommitRef:'0b4547f33a74ce911a0d324a53404cff1cc6e737',
        portalNetlifyState:'ready',
        portalNetlifyContext:'production',
        portalPublishedAt:'2026-09-28T19:48:21.076Z'
      }),
      invariants:Object.freeze({
        crmIsSourceNotBrain:true,
        noParallelCrm:true,
        noParallelGraphTruth:true,
        noParallelLearningStore:true,
        evidenceBeforeInference:true,
        contextBeforeAction:true,
        actionRequiresLineage:true,
        outcomeRequiresOrigin:true,
        realizedValueObservedNotSynthesized:true,
        learningUpdatesSharedPolicy:true,
        contextualPortalProjection:true,
        contextualProjectionGovernance:'PERMANENT',
        contextualProjectionLanguage:'Wat zien we? → Waarom telt dit? → Wat verwachten we? → Wat doen we? → Wat kwam eruit? → Wat leren we?',
        contextualProjectionTenantRuntimeOnly:true,
        contextualProjectionFailClosed:true,
        expectedRealizedVisualSeparation:true,
        roadmapContextBound:true,
        capabilityGraphContextBound:true,
        customerPortalTenantScopedOnly:true,
        noGlobalUnscopedGraphInCustomerUi:true
      })
    }),
    Object.freeze({
      id:'linkedin-production-auth-authority',
      label:'LinkedIn Production OAuth Authority',
      authority:'supabase+composio-provider-truth',
      owner:'social-publication-authority',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['brain_records.linkedin-composio-setup-current-state-v1','content_publication_obligations','LinkedIn provider URN']),
      outputs:Object.freeze(['channel-specific auth readiness','no-false-blocker decision','anti-duplicate reconnect guard']),
      runtime:Object.freeze({
        setupState:'linkedin-composio-setup-current-state-v1',
        companyOrganizationUrn:'urn:li:organization:18234216',
        publisher:'supabase/functions/powerhouse-social-publisher/index.ts',
        setup:'supabase/functions/powerhouse-composio-linkedin-setup/index.ts',
        skill:'.agents/skills/linkedin-composio-publisher/SKILL.md',
        learning:'brain/learning/2026-09-29-linkedin-production-runtime-authority-v1.json',
        companyStandardPolicy:'brain/policies/linkedin-company-standard-delivery-v1.json',
        companyStandardLearning:'brain/learning/2026-09-29-linkedin-company-standard-delivery-v1.json'
      }),
      productionEvidence:Object.freeze({
        runtimeStatus:'ACTIVE',
        companyReady:true,
        providerPostUrn:'urn:li:share:7510609161110482944',
        verifiedAt:'2026-09-29T08:25:46Z'
      }),
      invariants:Object.freeze({
        productionRuntimeIsCanonical:true,
        chatLocalConnectorIsDiagnosticOnly:true,
        providerUrnBlocksRepublish:true,
        humanOauthOnlyOnProductionHardBoundary:true,
        noRecoveryAliasProliferation:true,
        personalAndCompanyCapabilitiesSeparate:true,
        companyBusinessTopicsOnly:true,
        personalTopicLeakageBlocked:true,
        printerStoryFamilyGloballyRetired:true,
        productionAuthPrecedesChatLocalDiagnostics:true,
        liveTokenHealthRequired:true,
        safeAuthSelfHealing:true,
        explicitUserDeletionAllowsOneNewStoryReplacement:true
      })
    }),
    Object.freeze({
      id:'linkedin-sales-machine-public-intent-bridge',
      label:'LinkedIn Sales Machine — Public Intent Bridge',
      authority:'netlify+supabase',
      owner:'commercial-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['Bedrijfslek result/deel/order intent','SaaS checkout-start','website attribution context']),
      outputs:Object.freeze(['PII-free growth events','commercial intent evidence','Growth Swarm/NBA context','outcome-learning input']),
      runtime:Object.freeze({
        websiteRoutes:Object.freeze(['/','/zelfscan','/afsluiten']),
        eventEndpoint:'/api/growth-event',
        netlifyFunction:'netlify/functions/growth-event.mjs',
        supabaseIngest:'growth-datahub-ingest',
        linkedinSkill:'.agents/skills/powerhouse-linkedin-sales-machine/SKILL.md'
      }),
      productionEvidence:Object.freeze({
        githubImplementationMergeSha:'6bce84b1a3d3f7eba1b7291895f7e7925945fd31',
        productionReadbackRun:36474142016,
        skillProjectionRun:36474141948,
        netlifyDeployId:'6abac341b59a3f00080a08dc',
        netlifyCommitRef:'6bce84b1a3d3f7eba1b7291895f7e7925945fd31',
        netlifyPublishedAt:'2026-09-28T19:44:41.885Z'
      }),
      invariants:Object.freeze({
        piiInGrowthTelemetry:false,
        purposeBoundContactHandling:true,
        oneCanonicalGrowthLoop:true,
        noParallelCrm:true,
        noParallelIntentStore:true,
        consentAndSuppressionRemainAuthoritative:true,
        evidenceAndFatigueGatesRemainAuthoritative:true
      })
    }),
    Object.freeze({
      id:'seo-conversion-orders',
      label:'SEO + Behavioral Conversion-to-Orders Engine v2',
      authority:'github+netlify+supabase',
      owner:'seo-demand+growth-swarm',
      status:'ACTIVE_EVIDENCE_GATED',
      inputs:Object.freeze(['Search Console evidence','DataForSEO evidence','production page state','visitor context','funnel state','CTA/lead/proposal/order/revenue outcomes']),
      outputs:Object.freeze(['commercial SEO opportunity','experience decision','bounded reversible money-page change','experiment outcome','conversion outcome','learning pattern']),
      runtime:Object.freeze({
        skill:'.agents/skills/powerhouse-seo-conversion-orders/SKILL.md',
        growthSkill:'.agents/skills/powerhouse-growth-swarm/SKILL.md',
        persuasionSkill:'.agents/skills/powerhouse-persuasion-revenue/SKILL.md',
        growthLoop:'config/seo-growth-loop.json',
        allowlist:'config/seo-optimization-allowlist.json',
        moneyPageAuthority:'site/seo-order-map.json',
        moneyPageExpansionAuthority:'site/seo-order-expansion.json',
        localeRevenueAuthority:'site/seo-locale-revenue-map.json',
        localizedBuildAuthority:'tools/site-shell/build-localized-routes.mjs',
        sitemapAuthority:'tools/genereer-sitemap.mjs',
        bilingualRevenueSeo:Object.freeze({
          fingerprint:'seo|nl-en|keyword-ownership-to-revenue|v1',
          locales:Object.freeze(['nl','en']),
          dutchCanonical:'unprefixed',
          englishCanonical:'/en/*',
          marketSpecificEnglishKeywords:true,
          literalTranslationKeywordStrategyForbidden:true,
          sameOriginLinksPreserveLocale:true,
          hreflangRequired:Object.freeze(['nl','en','x-default']),
          sitemapIncludesEnglishCanonicals:true,
          revenueChain:'query -> canonical owner -> contextual internal links -> CTA -> lead -> proposal -> paid order -> realized revenue',
          measuredMarkets:Object.freeze(['Netherlands/nl','Netherlands/en','United Kingdom/en','United States/en']),
          regressions:Object.freeze(['tests/seo-locale-revenue-nl-en-v1.test.mjs','tests/seo-order-link-graph.test.mjs'])
        }),
        finalBuildAuthority:'tools/site-shell/apply-money-page-order-conversion.mjs',
        bedrijfslekStandaloneAuthority:'zelfscan.html',
        bedrijfslekV18Exclusion:'tools/v18-views-lijst.mjs',
        bedrijfslekProductLedGrowth:Object.freeze({
          route:'/zelfscan',
          valueBeforePii:true,
          miniLocalOnly:true,
          teamChallenge:true,
          challengePayload:Object.freeze(['score','risk_category','campaign_attribution']),
          terminalOutcomes:Object.freeze(['paid_order','realized_revenue']),
          regression:'tests/brain-bedrijfslek-product-led-acquisition-v1.test.mjs',
          learning:'brain/learning/2026-09-29-bedrijfslek-product-led-growth-borging-v2.json'
        }),
        learning:'brain/learning/2026-09-29-seo-conversion-orders-v1.json',
        companyBrainCategory:Object.freeze({route:'/company-brain',role:'category-acquisition-entry',status:'LIVE_PROVEN',claim:'Een Company Brain is waar Bedrijfsgeheugen begint.',conversion:'/zelfscan',terminalOutcomes:Object.freeze(['paid_order','realized_revenue']),learning:'brain/learning/2026-09-30-company-brain-category-positioning-v1.json',productionEvidence:Object.freeze({protectedMain:'936ca60ad5c2415ff2372880a61aea5b1d690875',netlifyDeployId:'6abcd38195a83a25791474e5',httpStatus:200,canonical:'/company-brain',mobileViewport:'390x844',pageErrors:0,failedAssets:0})})
      }),
      behavioralModels:Object.freeze(['Cialdini','loss-aversion','prospect-theory','Fogg Behavior Model','Hick-Hyman','cognitive-fluency','commitment-ladder','specificity','choice-architecture']),
      optimizationOrder:Object.freeze(['realized revenue','paid orders','qualified proposals','qualified meetings','qualified leads','CTA progression','engagement']),
      invariants:Object.freeze({
        trafficIsNotTerminalOutcome:true,
        productLedValueBeforePii:true,
        privacySafeTeamChallenge:true,
        noParallelBedrijfslekFunnel:true,
        existingCanonicalMoneyPageFirst:true,
        maxDailyAutonomousChanges:3,
        reversibleEvidenceGatedOnly:true,
        contextualPageCompositionAllowed:true,
        rollbackOnTrustAccessibilityOrQualifiedConversionRegression:true,
        productionReadbackRequired:true,
        revenueClaimRequiresObservedOutcome:true,
        noDoorwayThinSpamOrDarkPatterns:true,
        noFakeScarcityUrgencySocialProofHiddenCostsConfirmshamingOrPreselectedConsent:true,
        oneCanonicalCroRevenueStack:true,
        inheritedByAllChatsAndAgents:true,
        currentPrimaryQualification:'ungated Bedrijfslek /zelfscan on homepage; Frisse Blik remains contextual on other money pages',
        publicCopyRequiresSameLineageStaticI18n:true,
        finalBuildArtifactIsAuthority:true,
        bedrijfslekHasSingleRouteOwner:true,
        v18GeneratorMayOverwriteBedrijfslek:false,
        companyBrainIsCategoryNotProductRename:true,
        companyBrainCanonicalOwner:'/company-brain',
        companyBrainMeasuredToRevenue:true,
        staticI18nPostShellFinalArtifactCoverageRequired:true
      })
    }),
    Object.freeze({
      id:'website-portal-professional-parity',
      label:'Website ↔ Portal Professional Parity',
      authority:'github+netlify',
      owner:'website-portal-coherence',
      status:'ACTIVE_EVIDENCE_GATED',
      inputs:Object.freeze(['accepted website baseline','canonical header/footer','Powerhouse product taxonomy','pricing catalog','portal visual contract']),
      outputs:Object.freeze(['contextual public proposition','package recommendation journey','isolated portal demo','bounded portal visuals','canonical AI discovery']),
      runtime:Object.freeze({
        finalizer:'tools/site-shell/finalize-website-coherence-v1.mjs',
        pricing:'tools/site-shell/apply-commercial-pricing-v1.mjs',
        websiteStyle:'assets/site-coherence-v1.css',
        portalStyle:'portal-v2/site-parity-v1.css',
        packageAdvisor:'/pakketadvies',
        publicPortalDemo:'/portaal-demo',
        skill:'skills/website-portal-coherence.md',
        regression:'tests/brain-website-coherence-v1.test.mjs',
        learning:'brain/learning/2026-10-01-website-portal-coherence-v1.json'
      }),
      invariants:Object.freeze({
        customerValueCopyOnly:true,
        internalParityLanguagePubliclyForbidden:true,
        onePrimaryHeroPerPage:true,
        packageFinderReturnsRealAdvice:true,
        comparisonCtasShareBaseline:true,
        publicDemoSeparatedFromCustomerRuntime:true,
        portalVisualsContainerBounded:true,
        canonicalProductLines:Object.freeze(['Powerhouse Intelligence','Powerhouse Agents','Powerhouse Connect']),
        aiDiscoveryPreserved:true,
        contactRoute:'/contact',
        productionReadbackRequired:true
      })
    }),
    Object.freeze({
      id:'daily-full-connection-enrichment',
      label:'Daily Full Connection Enrichment',
      authority:'supabase',
      owner:'commercial-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['bg_connecties','linkedin_engagement_events','powerhouse_predictive_signals','bg_bedrijfsnieuws','bg_externe_signalen','powerhouse_runtime_events','person/company intelligence','opportunity/outcome lineage']),
      outputs:Object.freeze(['daily enriched connection graph','freshness/completeness rollup','person/company/customer opportunity context']),
      runtime:Object.freeze({
        stateTable:'public.powerhouse_connection_enrichment_state_v1',
        view:'public.powerhouse_connection_enrichment_v1',
        refresh:'public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)',
        schedulerOwner:'powerhouse-commercial-learning-v1'
      }),
      invariants:Object.freeze({
        everyConnectionDaily:true,
        allIngestedEvidenceProjected:true,
        sourceEvidencePreserved:true,
        deepDiscoveryBounded:true,
        sensitiveInferenceAllowed:false,
        noParallelCrm:true,
        noParallelScheduler:true
      })
    }),
    Object.freeze({
      id:'relationship-external-intelligence',
      label:'Relationship External Intelligence',
      authority:'supabase',
      owner:'commercial-intelligence',
      status:'LIVE_PROVEN_RUNTIME',
      inputs:Object.freeze(['public web evidence','LinkedIn/company updates via supported capabilities','runtime events','person/company/customer lineage']),
      outputs:Object.freeze(['person/company/customer enriched context','predictive signals','opportunity/NBA evidence features']),
      runtime:Object.freeze({
        projector:'public.powerhouse_refresh_relationship_external_intelligence_v1(date)',
        contextView:'public.powerhouse_relationship_context_enriched_v1',
        schedulerOwner:'powerhouse-commercial-learning-v1'
      }),
      invariants:Object.freeze({
        noLooseNewsDeadEnd:true,
        externalEvidenceIsNotBuyingIntent:true,
        sensitiveInferenceAllowed:false,
        preserveProvenance:true,
        noParallelCrm:true,
        noParallelScheduler:true
      })
    }),
    Object.freeze({
      id:'autonomous-engineering-fabric-v3',
      label:'Autonomous Engineering Fabric v3',
      authority:'github',
      owner:'delivery-intelligence',
      status:'LIVE_PROVEN',
      inputs:Object.freeze(['user/chat intent','changed paths','dependency graph','CI telemetry','agent outcome scorecard']),
      outputs:Object.freeze(['risk-classed work packages','capability-routed specialists','bounded parallel waves','single integrated candidate','late-bound closure manifest','daily engineering tuning']),
      runtime:Object.freeze({
        policy:'config/powerhouse-autonomous-engineering-fabric-v3.json',
        tuning:'config/powerhouse-engineering-tuning.json',
        planner:'scripts/brain/autonomous-engineering-fabric-v3.mjs',
        optimizerWorkflow:'.github/workflows/powerhouse-autonomous-engineering-optimizer.yml',
        requiredGate:'.github/workflows/required-test.yml'
      }),
      productionEvidence:Object.freeze({
        implementationMergeSha:'35cc516051f51fa78ef5842687b243c1de810715',
        requiredPrRun:36467540983,
        codeqlPrRun:36467540522,
        optimizerPrRun:36467540607,
        dailySelfEvolutionPrRun:36467540608,
        skillProjectionPrRun:36467540627,
        netlifyDeployId:'6abab74554a72a00072dae3b',
        netlifyCommitRef:'35cc516051f51fa78ef5842687b243c1de810715',
        netlifyPublishedAt:'2026-09-28T18:53:41.769Z'
      }),
      invariants:Object.freeze({
        oneIntegrationWriterPerObligation:true,
        specialistsParallelBeforeIntegration:true,
        riskAwareTesting:true,
        impactGraphRequired:true,
        hotSharedFilesLateBound:true,
        outcomeAwareAgentRouting:true,
        dailyBoundedSelfOptimization:true,
        protectedReleaseAuthorityUnchanged:true,
        noSafetyGateWeakening:true
      })
    }),
    Object.freeze({
      id:'powerhouse-ci-intelligence',
      label:'Powerhouse CI Intelligence & Acceleration',
      authority:'github',
      owner:'delivery-intelligence',
      status:'LIVE_PROVEN',
      inputs:Object.freeze(['GitHub Actions workflow runs','job queue/start/finish timestamps','PR SHA fan-out','lane classification']),
      outputs:Object.freeze(['queue/execution/fan-out metrics','critical-path optimization evidence','runner-waste prevention']),
      runtime:Object.freeze({
        workflow:'.github/workflows/powerhouse-ci-intelligence.yml',
        collector:'scripts/brain/powerhouse-ci-intelligence.mjs',
        requiredGate:'.github/workflows/required-test.yml',
        websiteLane:'.github/workflows/lane-website.yml'
      }),
      productionEvidence:Object.freeze({
        mainSha:'451c6f40868fb35af77d70f6f6aa0972b324f634',
        requiredPrRun:36449795424,
        productionReadbackRun:36454941832,
        ciIntelligenceRun:36454941660,
        netlifyDeployId:'6aba9ce2aa152f00088fc87c',
        netlifyCommitRef:'451c6f40868fb35af77d70f6f6aa0972b324f634'
      }),
      invariants:Object.freeze({
        netlifyBuildParityProductionEnv:true,
        oneRequiredAuthorityPerPr:true,
        supersededPrRunsCancelled:true,
        affectedLanesOnly:true,
        packageManifestNpmCache:true,
        exactShaPreviewReuse:true,
        localBrowserBuildFallbackOnly:true,
        safetyGatesNeverWeakened:true
      })
    }),
    Object.freeze({
      id:'management-accounting-value-driver-intelligence',
      label:'Management Accounting & Value Driver Intelligence',
      authority:'supabase',
      owner:'finance-value-intelligence',
      status:'CANDIDATE_DELIVERY',
      inputs:Object.freeze(['tenant financial metrics','workforce/productivity metrics','operations/commercial metrics','explicit tenant benchmarks','due-diligence/value inputs']),
      outputs:Object.freeze(['management-accounting metrics','value-driver graph','impact/effort roadmap candidates','cash and valuation projections','data gaps']),
      runtime:Object.freeze({
        brainModule:'brain/economics/management-accounting-intelligence.mjs',
        portalModule:'portal-v2/modules/management-accounting-intelligence.js',
        overviewSurface:'Portal V2 executive overview',
        roadmapSurface:'portal.roadmap.items'
      }),
      invariants:Object.freeze({
        noGenericBenchmarkAsCustomerFact:true,
        missingInputNeverBecomesZero:true,
        outputPerHourPreferredWhenAvailable:true,
        workingCapitalIsCashNotEbitda:true,
        capacityValueIsNotCashSaving:true,
        valuationRequiresSupportedEarningsAndMultiple:true,
        roadmapFingerprintDedupe:true,
        derivedValueRemainsPotentialUntilOutcome:true
      })
    }),
    Object.freeze({
      id:'trigger-based-mkb-acquisition',
      label:'Trigger-based MKB Acquisition',
      authority:'supabase',
      owner:'commercial-intelligence',
      status:'LIVE_PROVEN_FAIL_CLOSED_RUNTIME',
      inputs:Object.freeze(['explicit-company-trigger-evidence','company-scoped-predictive-signals']),
      outputs:Object.freeze(['powerhouse_opportunities','powerhouse_forecasts','internal-research-actions']),
      runtime:Object.freeze({
        view:'public.powerhouse_mkb_trigger_intelligence_v1',
        refreshFunction:'public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(date)',
        cycleFunction:'public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)',
        schedulerJob:'powerhouse-commercial-learning-v1',
        scheduler:'27 * * * *'
      }),
      safety:Object.freeze({
        relationshipActivationAloneIsTrigger:false,
        externalSideEffectsAllowed:false,
        speculativeRevenueValueAllowed:false,
        hypothesisTruthBoundary:true
      }),
      productionEvidence:Object.freeze({
        githubMainMergeSha:'4e16c5c496241ce516cd13373103c51b4f9fd6dd',
        migration:'trigger_based_mkb_acquisition_runtime_v1',
        firstControlledEligibleTriggers:0,
        firstControlledExternalOutreach:false,
        ordinaryConnectionFalsePositives:0,
        newSurfaceSecurityAdvisorLints:0
      })
    }),
    Object.freeze({
      id:'workshop-scan-customer-portal',
      label:'Workshop Scan → Personal PDF → Customer Portal',
      authority:'supabase',
      owner:'customer-intelligence',
      status:'LIVE_PROVEN_PERSISTENT_PORTAL',
      inputs:Object.freeze(['consented-workshop-answers','company-context','contact-name','contact-email','contact-phone','optional-company-website']),
      outputs:Object.freeze(['personal-scan-pdf','private-portal-intake','canonical-brain-portal-state','identity-claimed-customer-portal']),
      runtime:Object.freeze({
        scanRoute:'/scan',
        publicIngest:'/api/powerhouse-scan-ingest',
        portalClaim:'/api/portal-scans',
        supabaseFunction:'powerhouse-scan-ingest',
        scanTable:'public.scan_inzendingen',
        privateIntakeTable:'public.workshop_portal_intakes',
        portalStateTable:'public.portal_state_layers'
      }),
      invariants:Object.freeze({
        singleSubmissionKey:true,
        durableServerSideStorage:true,
        portalPreprovisionBeforeAccountClaim:true,
        privatePiiIntake:true,
        personalPdfShowsContactNameEmailPhone:true,
        aggregateLearningContainsPii:false,
        trustedCompanyLogoOnly:true,
        chatsAndAgentsReuseCanonicalLineage:true
      }),
      productionEvidence:Object.freeze({
        productionSmokeWorkflow:'Powerhouse Scan Production Proof',
        productionReadbackWorkflow:'Production Release Readback',
        runtimeFunctionVersion:4,
        privacyModel:'RLS + service-role-only intake'
      })
    })
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
    githubWorkflows:Object.freeze(["add-netlify-component-preview.yml","ai-model-intelligence.yml","approved-central-blog.yml","autonomous-improvement-completion-gate.yml","bg168-materiality-promotion-tests.yml","bg184-stateful-blocker-dedupe-tests.yml","blog-bijwerken.yml","blog-technical-seo-gate.yml","brain-foundation-diagnostic.yml","brain-foundation-verify.yml","buffer-social-learning.yml","business-os-experience.yml","business-os-foundation.yml","business-os-intelligence.yml","business-os-migration.yml","business-os-trust.yml","canonical-brand-shell-full-build.yml","canonical-brand-shell-live-readback.yml","canonical-brand-shell-test.yml","chat-learning-preflight-pr.yml","codeql.yml","completion-supervisor-backfill-shadow.yml","component-foundation-tdd.yml","component-integration-tdd.yml","component-preview.yml","config-wacht.yml","content-growth-ci.yml","content-growth-learning.yml","daily-blog-live-watchdog.yml","daily-blog-publisher.yml","engineering-intelligence-trust.yml","engineering-os-learning.yml","engineering-supply-chain-trust.yml","error-learning-contract.yml","fresh-device-autonomy-canary.yml","hero-media-production-verify.yml","historical-terminal-reconciliation.yml","homepage-hero-video-verify.yml","homepage-pricing-boundary-regression.yml","klanten-uit-broncode.yml","lane-automation.yml","lane-backend.yml","lane-portal.yml","lane-website.yml","learning-contract-delivery-classifier-tests.yml","linkedin-revenue-cockpit-tests.yml","live-preview-smoke.yml","main-protection-observation.yml","main-write-integrity-regression.yml","main-write-integrity.yml","menu-balk-fix.yml","native-approved-blog-supply.yml","obligation-terminal-closure.yml","outcome-obligation-sweep.yml","paginacontrole-debug.yml","paginacontrole.yml","portal-native-regression-tests.yml","portal-parity.yml","portal-v2-live-preview.yml","portal-v2-production-dom-readback.yml","portal-v2-tests.yml","portal-visual-density.yml","powerhouse-assurance.yml","powerhouse-autonomous-engineering-optimizer.yml","powerhouse-ci-intelligence.yml","powerhouse-closure-a-f.yml","powerhouse-daily-blog.yml","powerhouse-daily-self-evolution.yml","powerhouse-delivery-hygiene.yml","powerhouse-delivery-recovery-supervisor.yml","powerhouse-foresight-autonomy.yml","powerhouse-merged-branch-cleanup.yml","powerhouse-obligation-terminalizer.yml","powerhouse-public-rls-regression-guard.yml","powerhouse-quality-intelligence.yml","powerhouse-quality-surface-gate.yml","powerhouse-repository-janitor.yml","powerhouse-resource-intelligence.yml","powerhouse-scan-production-proof.yml","powerhouse-security-operations-closure.yml","powerhouse-skill-projection.yml","powerhouse-supabase-security-contract.yml","powerhouse-terminal-writer-lease-closure-guard.yml","pr-janitor.yml","prijzen-hero-seo-regression.yml","production-delivery-self-heal.yml","production-release-readback.yml","production-source-snapshot.yml","regelgeving-actueel.yml","regelgeving-bijwerken.yml","regulatory-source-watch.yml","repo-writer-candidate-shadow.yml","repo-writer-cheap-canary.yml","repo-writer-gate-dispatch.yml","repo-writer-operational-verification.yml","repo-writer-parity-rollback.yml","repository-hygiene.yml","required-gate-watchdog.yml","required-test.yml","revenue-content-intelligence.yml","revenue-learning.yml","runtime-authority-governance-tests.yml","security-operations-proof.yml","seo-controle.yml","seo-growth-intelligence.yml","seo-order-engine.yml","shared-agent-memory-tests.yml","social-publication-recovery.yml","supabase-edge-production-authority.yml","supabase-pr-preview.yml","supabase-supported-migration-repair-3742.yml","unified-brain-delivery.yml","unified-content-operations.yml","universal-closed-loop-learning.yml","universal-event-retention-contract.yml","v18-megamenu-production-readback.yml","v18-production-promotion.yml","verify-approved-central-blog.yml","website-cross-browser-screenshot-assurance.yml","weekblog.yml","whole-brain-canonical-loop-v2.yml","writer-certification-reconcile.yml","writer-production-reconcile.yml"]),
    netlifyFunctions:Object.freeze(["_ai-usage-store.mjs","_brain-ai.mjs","_brain-event-store.mjs","_buffer-social-collector.mjs","_cms-gateway.mjs","_commercial-lead.mjs","_connector-ai.mjs","_cost-projection-store.mjs","_data-sovereignty-client.mjs","_portal-connectors-store.mjs","_portal-eu-primary-store.mjs","_portal-project-store.mjs","_portal-read-model-store.mjs","_portal-supabase-store.mjs","_revenue-learning-model.mjs","_revenue-learning-store.mjs","_security-trust-client.mjs","_social-learning-model.mjs","_social-learning-store.mjs","ai-modelwijzer-lead.mjs","brain-operating-ingest.mjs","brain-operating-loop.mjs","brain-runtime-metric.mjs","buffer-social-collect.mjs","checkout-activate.mjs","checkout-create.mjs","checkout-readiness.mjs","cms-admin.mjs","cms-public.mjs","company-decision-notion-sync.mjs","company-decision.mjs","connector-ai-guide.mjs","connector-readiness.mjs","content-learning-application-reconcile.mjs","content-learning.mjs","data-sovereignty-runtime-proof.mjs","data-sovereignty.mjs","document-extractor.mjs","growth-drain.mjs","growth-event.mjs","growth-intelligence-daily.mjs","growth-outcome.mjs","growth-replay.mjs","i18n-translate.mjs","instagram-video-frames.mjs","koppelingen.mjs","linkedin-revenue-cockpit.mjs","meta-instagram-token-refresh.mjs","monitor.mjs","need-discovery.mjs","portaalvraag.mjs","portal-authenticated-production-proof-readback.mjs","portal-authenticated-production-proof.mjs","portal-business-input.mjs","portal-connectors.mjs","portal-entitlements.mjs","portal-feedback.mjs","portal-forecasts.mjs","portal-ondernemersdata.mjs","portal-prediction-intelligence.mjs","portal-project.mjs","portal-scans.mjs","portal-state.mjs","powerhouse-commercial-heartbeat-background.mjs","powerhouse-commercial-heartbeat-schedule.mjs","powerhouse-composio-config.mjs","powerhouse-composio-secret-sync-deploy.mjs","powerhouse-composio-secret-sync-now.mjs","powerhouse-composio-secret-sync.mjs","powerhouse-control-plane-evidence.mjs","powerhouse-control-plane.mjs","powerhouse-costs.mjs","powerhouse-meta-instagram-config.mjs","powerhouse-meta-instagram-oauth-callback.mjs","powerhouse-observability.mjs","powerhouse-scan-ingest.mjs","revenue-learning-context.mjs","revenue-learning-evaluate.mjs","revenue-learning-project.mjs","security-trust.mjs","social-learning-context.mjs","social-learning-evaluate.mjs","social-outcome-ingest.mjs","social-publication-delivery-deploy.mjs","social-publication-delivery.mjs","stripe-webhook.mjs","tenant-ai-activation-status.mjs","tenant-ai-inference.mjs","vraag.mjs"]),
    supabaseFunctions:Object.freeze(["_shared","bg-analytics-sync-composio","bg-buffer-sync","bg-dagoverzicht","bg-externe-signalen","bg-ga4-sync","bg-interactie","bg-notion-sync","bg-opdrachtenradar","bg-pre-publish-review","bg-social-metrics-sync","brain-operating-authority","brain-runtime-metric-ingest","commercial-lead-ingest","content-operations","growth-datahub-ingest","netlify-deploy-bridge","portal-state-eu","powerhouse-autonomous-outreach","powerhouse-blog-export","powerhouse-blog-queue","powerhouse-commercial-heartbeat-runner","powerhouse-commercial-message-composer","powerhouse-composio-instagram-setup","powerhouse-composio-linkedin-setup","powerhouse-content-loop","powerhouse-content-orchestrator","powerhouse-dataforseo-intelligence","powerhouse-email-reply-loop","powerhouse-forecast-calibrator","powerhouse-growth-tools","powerhouse-human-sales-composer","powerhouse-instagram-media-router","powerhouse-instagram-media-verifier","powerhouse-instagram-temporal-verifier","powerhouse-linkedin-sales-machine","powerhouse-meta-instagram-setup","powerhouse-mira-problem-radar","powerhouse-predictive-engine","powerhouse-relationship-public-research","powerhouse-revenue-intelligence","powerhouse-runtime","powerhouse-runtime-verifier-v1","powerhouse-salesrobot-ingest","powerhouse-scan-ingest","powerhouse-seo-opportunity-resolver","powerhouse-social-publisher","powerhouse-system-map-inventory","powerhouse-visual-assurance-sync","resource-usage-eu","revenue-learning-store","social-learning-store","social-recovery-runner","supabase-migration-repair-bridge"]),
    skills:Object.freeze(["instagram-composio-publisher","linkedin-composio-publisher","personal-linkedin-life-only","powerhouse-ai-model-intelligence","powerhouse-autonomous-engineering-fabric","powerhouse-browser-gate-boundedness","powerhouse-company-intelligence-os","powerhouse-connector-response-normalization","powerhouse-continuity","powerhouse-daily-full-connection-enrichment","powerhouse-delivery-concurrency","powerhouse-delivery-self-optimization","powerhouse-foresight-prediction-intelligence","powerhouse-github-acceleration-stack","powerhouse-green-assurance","powerhouse-growth-swarm","powerhouse-linkedin-company-growth","powerhouse-linkedin-sales-machine","powerhouse-management-accounting-intelligence","powerhouse-manual-sales-handoff","powerhouse-need-discovery","powerhouse-netlify-production-truth","powerhouse-persuasion-revenue","powerhouse-post-merge-codeql","powerhouse-relationship-external-intelligence","powerhouse-relationship-revenue","powerhouse-resource-sustainability","powerhouse-security-trust-center","powerhouse-self-improvement-layer","powerhouse-seo-conversion-orders","powerhouse-source-universe-impact-engine","powerhouse-system-map-governance","powerhouse-toolchain-authority","seo-revenue-growth","trigger-based-mkb-acquisition"]),
    agentFabricModules:Object.freeze(["agent-fabric.mjs","agent-registry.mjs","agent-team.mjs","agent-work.mjs","completion-supervisor.mjs","learning-memory.mjs","self-heal.mjs","team-memory-bridge.mjs"])
  }),
  providerSnapshot:Object.freeze({
    supabase:Object.freeze({tables:255,views:136,functions:250,activeCronJobs:51,projectId:'adhjwmvyoixzjtmiroln'}),
    github:Object.freeze({workflows:123,skills:35,agentFabricModules:8}),
    netlify:Object.freeze({functions:89}),
    notion:Object.freeze({canonicalSystemMap:true,humanHandbook:true,latestVerifiedState:true,agentActivityLog:true})
  }),
  agentRegistrationContract:Object.freeze({
    required:true,
    rule:'Every material current or future chat, agent, workflow or autonomous capability must be an intrinsic Powerhouse loop node and must become discoverable in this System Map through canonical runtime actor evidence and/or repository inventory registration.',
    beforeWork:Object.freeze(['read canonical System Map','read current state and open obligations','reuse existing capability before creating a new one']),
    onCreateOrChange:Object.freeze(['register component/agent identity','declare owner, domain, inputs, outputs and relations','emit runtime evidence with actor identity','update tests/contracts/inventory when structural topology changes','update repository human documentation and the human System Map in the same lineage']),
    beforeTerminal:Object.freeze(['production/provider readback','learning + prevention writeback','skill projection when applicable','repository human documentation readback','System Map read-after-write']),
    failClosed:'An unregistered material agent/capability or a stale topology inventory is WRITEBACK_INCOMPLETE and cannot be LIVE_BEWEZEN.',
    contextualVisibilityRule:'Material intelligence that changes a user decision must be projected into the relevant Portal V2 context in the same lineage.'
  }),
  systemMapGovernance:Object.freeze({
    fingerprint:'powerhouse|system-map|same-lineage-auto-writeback|v1',
    canonicalMachineSource:'platform/system-map/canonical-system-map.mjs',
    canonicalHumanSource:'docs/powerhouse/POWERHOUSE_SYSTEM_MAP_GOVERNANCE.md',
    portalProjection:'/portal-v2/?page=powerhouse-control-center',
    inheritedBy:Object.freeze(['all-current-chats','all-future-chats','all-current-agents','all-future-agents','workflows','autonomous-nodes']),
    trigger:'Any material change to skills, agents, intelligence, workflows, connectors, runtime authority, data flows, topology, ownership, relationships, charts or canonical control surfaces.',
    sameLineageRequired:true,
    readAfterWriteRequired:true,
    userReminderRequired:false,
    requiredWriteback:Object.freeze(['machine-system-map','human-architecture-docs','relevant-skill-inventory','brain-learning','development-ledger','portal-or-human-projection-when-applicable']),
    failClosedState:'SYSTEM_MAP_WRITEBACK_INCOMPLETE',
    terminalGreenWithStaleMap:false
  }),
  canonicalWebsiteChrome:Object.freeze({
    fingerprint:'powerhouse|website-shell|canonical-chrome-geometry|v1',
    label:'Canonical public website CMS shell',
    authority:'github+netlify',
    owner:'website-delivery',
    status:'ACTIVE_PROTECTED_CONTRACT',
    surfaces:Object.freeze(['public-header','primary-navigation','footer','solutions-megamenu','more-megamenu','mobile-navigation','public-language-switcher']),
    publicLocaleAuthority:Object.freeze({
      fingerprint:'powerhouse|public-cms-i18n|shared-shell-same-route|v1',
      locales:Object.freeze(['nl','en']),
      dutchCanonical:'unprefixed',
      englishCanonical:'/en/*',
      sameRouteInvariant:'/x <-> /en/x; / <-> /en/',
      buildAuthority:Object.freeze(['tools/site-shell/apply-i18n.mjs','tools/site-shell/build-localized-routes.mjs']),
      runtimeGuard:'assets/js/i18n.js',
      clickOwnership:'window-capture-before-mobile-menu-handlers',
      cacheRule:'versioned-i18n-assets-required',
      navigationPersistence:Object.freeze({
        fingerprint:'website|i18n|persistent-public-navigation|v1',
        selectedLocalePersistsAcrossPublicNavigation:true,
        englishTargets:'/en/*',
        dutchTargets:'unprefixed',
        preserves:Object.freeze(['query','hash']),
        dynamicLinksIncluded:true,
        excludedPrefixes:Object.freeze(['/api/','/.netlify/','/assets/','/functions/','/portal','/klantportaal']),
        regression:'tests/brain-i18n-persistent-navigation-v1.test.mjs',
        learning:'brain/learning/2026-09-30-public-i18n-persistent-navigation-v1.json'
      }),
      productionAuthority:'netlify-current-deploy-exact-main',
      liveReadback:Object.freeze(['pricing-nl-en-nl','systems-nl-en-nl','cross-page-locale-persistence','html-lang','header-footer-language-state'])
    }),
    geometry:Object.freeze({
      desktopShellWidthPx:1220,
      desktopNavigationHeightPx:72,
      moreMegamenuMaxWidthPx:1190,
      solutionsMegamenuWidthPx:850,
      desktopGutterPx:20,
      mobileGutterPx:12,
      routeParityTolerancePx:1,
      megamenuParityTolerancePx:2
    }),
    authorityFiles:Object.freeze([
      'tools/bouw-v18-production-core.mjs',
      'tools/site-shell/v18-megamenu-browser-check.mjs',
      'tests/v18-megamenu-regression-lock.test.mjs',
      'docs/sitestandaard.md'
    ]),
    inheritedBy:Object.freeze(['all-public-routes','all-current-chats','all-future-chats','all-current-agents','all-future-agents','website-workflows']),
    invariant:'No route-local header/navigation/footer/megamenu geometry fork; every public route inherits one CMS-like canonical chrome.',
    productionReadbackRequired:true
  }),
  bilingualSeoRevenue:Object.freeze({
    fingerprint:'seo|nl-en|revenue-ownership|hreflang|v1',
    label:'Bilingual SEO → revenue intelligence',
    owner:'seo-revenue-growth',
    status:'ACTIVE_PROTECTED_CONTRACT',
    locales:Object.freeze(['nl','en']),
    dutchCanonical:'unprefixed',
    englishCanonical:'/en/*',
    canonicalOwnerRegistry:Object.freeze(['site/seo-order-map.json','site/seo-order-expansion.json']),
    localeRevenueProjection:'site/seo-locale-revenue-map.json',
    marketEvidence:Object.freeze({
      table:'public.powerhouse_seo_keyword_intelligence_v1',
      priorityView:'public.powerhouse_seo_keyword_revenue_priority_v1',
      identity:'tenant_id + locale + market + keyword',
      source:'DataForSEO + Search Console + realized outcomes',
      forecastIsRevenue:false
    }),
    productionPipeline:Object.freeze([
      'tools/site-shell/build-localized-routes.mjs',
      'tools/seo-order-engine/apply-revenue-links.mjs',
      'tools/genereer-sitemap.mjs',
      'tools/seo-order-engine/validate-locales.mjs'
    ]),
    staticEnglishCache:Object.freeze({
      requiredInProduction:true,
      authority:'config/bg-static-i18n-en.json + config/bg-static-i18n-en.d/*.json',
      exactSourceStringRequired:true,
      validator:'node tools/site-shell/build-localized-routes.mjs --validate-cache',
      failClosedState:'STATIC_I18N_CACHE_INCOMPLETE',
      dutchFallbackOnEnglishProduction:false,
      learning:'brain/learning/2026-09-30-seo-static-i18n-cache-complete-v1.json'
    }),
    technicalContracts:Object.freeze([
      'self-canonical-per-locale',
      'reciprocal-hreflang-nl-en-x-default',
      'NL-and-EN-sitemap-indexation',
      'no-legacy-nl-canonicals',
      'one-keyword-owner-per-locale',
      'localized-support-owner-inheritance'
    ]),
    revenueLoop:'query/market evidence -> canonical intent owner -> localized landing -> internal revenue links -> CTA -> lead -> proposal -> paid order -> realized revenue -> learning -> next SEO action',
    searchIntelligence:'tools/seo-growth/search-intelligence.mjs',
    dailyRevenueIntelligence:'netlify/functions/growth-intelligence-daily.mjs',
    primaryCommercialAsset:Object.freeze({
      route:'/ai-modelwijzer',
      nlKeyword:'ai modellen vergelijken',
      enRoute:'/en/ai-modelwijzer',
      enKeyword:'AI model comparison'
    }),
    failClosedStates:Object.freeze(['KEYWORD_OWNER_COLLISION','LOCALE_PEER_MISSING','HREFLANG_MISMATCH','SITEMAP_LOCALE_GAP','REVENUE_LINK_GAP']),
    outcomePriority:Object.freeze(['realized_revenue','paid_order','proposal','lead','cta','organic_click','impression'])
  }),
  sourceBackedOutbound:Object.freeze({
    fingerprint:'powerhouse-source-backed-all-channels-v1',
    label:'Source-backed outbound loop',
    status:'ACTIVE_CONTINUOUSLY_ASSURED',
    loopAssuranceKey:'source-backed-outbound',
    cadenceMinutes:60,
    canonicalLineage:'SOURCE -> EVIDENCE -> DEDUPE -> PROBLEM/TRIGGER -> CHANNEL FIT -> CANDIDATE -> IDENTITY/TRUTH GATE -> PUBLISH/SEND -> PROVIDER READBACK -> OUTCOME -> LEARNING -> NEXT SELECTION',
    channels:Object.freeze(['instagram_company','linkedin_personal','linkedin_company','blog','email','linkedin_dm']),
    runtimeAuthorities:Object.freeze([
      'public.powerhouse_outbound_source_lineage_v1',
      'public.powerhouse_materialize_source_backed_channel_candidates_v1(date)',
      'public.powerhouse_require_source_for_direct_outreach_v1()',
      'public.powerhouse_refresh_outbound_source_lineage_v1(date)',
      'public.powerhouse_refresh_source_backed_outbound_assurance_v1(date)',
      'supabase/functions/powerhouse-content-orchestrator/index.ts'
    ]),
    sourceRule:'Fresh eligible evidence-backed candidates outrank static calendar or evergreen fallback.',
    personalTruthRule:'External public evidence may select a LinkedIn-personal theme but can never manufacture an Arthur first-person experience.',
    directOutreachRule:'Email and LinkedIn DM require traceable account/person evidence plus person/company context before send eligibility.',
    outcomeWriteback:Object.freeze(['social-metrics','email-replies','linkedin-dm-replies','leads','meetings','orders','revenue']),
    continuousAssurance:Object.freeze({requiredStages:8,scheduler:'powerhouse-outbound-source-lineage-hourly-v1',greenRequiresCurrentRuntime:true})
  }),
  needDiscovery:Object.freeze({
    fingerprint:'powerhouse-need-discovery-v1',
    label:'Powerhouse Need Discovery',
    authority:'github+supabase',
    owner:'powerhouse-commercial-learning-v1',
    status:'CANDIDATE',
    stages:Object.freeze(['goal','situation','problem','impact','urgency','value','decision','next_step']),
    channels:Object.freeze(['website','linkedin_company','blog','email','linkedin_dm','sales_conversation','portal']),
    runtime:Object.freeze({
      engine:'brain/revenue/need-discovery.mjs',
      contract:'config/powerhouse-need-discovery-v1.json',
      events:'public.powerhouse_need_discovery_events_v1',
      profiles:'public.powerhouse_need_discovery_profiles_v1',
      actionEnrichment:'public.powerhouse_apply_need_discovery_v1()',
      website:'https://www.bedrijfsgeheugen.nl/behoeftecheck',
      portal:'/portal-v2/?page=sales-intelligence'
    }),
    invariant:'Engagement is interest only. An offer requires a buyer-confirmed problem, impact and urgency.',
    outcomeLoop:Object.freeze(['reply','confirmed_problem','confirmed_impact','qualified_conversation','meeting','scan','proposal','paid_order','realized_revenue','learning'])
  }),
  socialPublicationGovernance:Object.freeze({
    fingerprint:'linkedin-company-historical-dedupe-v5',
    rule:'Every social post must use a genuinely new underlying story family; LinkedIn company and personal both require durable historical story fingerprints before provider write.',
    scope:'cross-date-cross-channel-all-chats-agents',
    providerCreateConsumesStory:true,
    userReportedDuplicateRetiresStoryFamily:true,
    canonicalCompanyNormalization:Object.freeze(['urls','hashtags','publication-date-markers','punctuation-formatting-noise','whitespace']),
    cumulativeGates:Object.freeze(['raw-hash','normalized-hash','shingle-similarity','canonical-story-fingerprint','semantic-story-family']),
    atomicDailyWriterIsHistoricalNoveltyProof:false,
    retryReconnectReplacementWriteForbidden:true,
    runtimeAuthority:'supabase/functions/powerhouse-social-publisher/index.ts',
    regressionAuthority:'tests/brain-linkedin-company-historical-dedupe-v1.test.mjs',
    learningAuthority:'brain/learning/2026-09-29-linkedin-company-historical-dedupe-v1.json',
    skillAuthority:'.agents/skills/linkedin-composio-publisher/SKILL.md',
    knownRetiredExamples:Object.freeze(['printer','employee_absence_or_departure__knowledge_only_in_heads'])
  }),
  userFacingReportingContract:Object.freeze({
    fingerprint:'delivery|user-facing-reporting|terminal-outcomes-only|v1',
    mode:'TERMINAL_OUTCOMES_ONLY',
    internalExecutionStateUserVisible:false,
    allowedTerminalStates:Object.freeze(['LIVE_BEWEZEN','ROLLED_BACK_GREEN','BLOCKED_HARD_BOUNDARY']),
    hardBoundaryOutput:'minimum external human action only',
    technicalDetailPolicy:'explicit user request only',
    interruptionCreatesHandoff:false,
    continuationFingerprint:'delivery|terminal-continuation|no-internal-handoff|v2',
    ownerMustContinueUntilTerminal:true,
    internalBlockerIsStopCondition:false,
    chatOrClientTimeoutCancelsObligation:false,
    userContinuePromptRequired:false,
    resumeFromCanonicalCheckpoint:true
  })
});


export const POWERHOUSE_LOOP_ASSURANCE_V3 = Object.freeze({
  fingerprint:'powerhouse|loop-assurance|receipt-bridge|v3',
  owner:'powerhouse-loop-assurance-v2',
  cadenceMinutes:5,
  registry:'public.powerhouse_loop_assurance_registry_v1',
  receipts:'public.powerhouse_loop_assurance_receipts_v1',
  state:'public.powerhouse_loop_assurance_state_v1',
  aggregateHealth:'public.powerhouse_loop_integrity_health_v1',
  receiptBridge:'public.powerhouse_sync_loop_assurance_receipts_v1',
  requiredStages:Object.freeze(['input','decision','action','readback','outcome','measurement','learning','guard']),
  criticalZeroEvidence:'RED',
  truthRule:'No synthetic outcome, learning or guard evidence; GREEN requires fresh proof for every required stage.'
});

export const POWERHOUSE_LOOP_ASSURANCE_TERMINAL_LIVE_CLOSURE_V1 = Object.freeze({
  fingerprint:'powerhouse|loop-assurance|terminal-live-closure|2026-09-30-v1',
  status:'LIVE_WITH_TRUTHFUL_AMBER_FLEET',
  inheritedBy:Object.freeze(['all-current-chats','all-future-chats','all-current-agents','all-future-agents']),
  dynamicRegistry:true,
  exactGreenRule:'8/8 fresh required stage evidence',
  historicalGreenReusable:false,
  protectedMain:'9ae500bb184c5e36053c7ca64fb2d51bea070d9c',
  netlify:Object.freeze({
    state:'ready',
    commitRef:'9ae500bb184c5e36053c7ca64fb2d51bea070d9c',
    publishedAt:'2026-09-29T19:31:30.436Z'
  }),
  productionReadback:Object.freeze({
    observedAt:'2026-09-29T19:31:53.360061Z',
    totalLoops:13,
    greenLoops:2,
    amberLoops:11,
    redLoops:0,
    fullyEvidencedLoops:2,
    greenLoopKeys:Object.freeze(['autonomous-outreach','source-backed-outbound'])
  }),
  closureArtifacts:Object.freeze([
    'brain/learning/2026-09-30-powerhouse-loop-assurance-terminal-live-closure-v1.json',
    'docs/development-ledger-events/2026-09-30-powerhouse-loop-assurance-terminal-live-closure-v1.md',
    'docs/changes/2026-09-30-powerhouse-loop-assurance-terminal-live-closure-v1.md',
    '.agents/skills/powerhouse-green-assurance/SKILL.md',
    'AGENTS.md'
  ])
});


export const COMMERCIAL_OUTBOUND_SELF_HEAL_V1 = Object.freeze({
  fingerprint:'commercial|outbound-transport-self-heal|gmail-linkedin-dm|v1',
  owner:'powerhouse-commercial-learning-v1',
  salesActionAuthority:'public.powerhouse_sales_actions',
  outcomeAuthority:'public.powerhouse_sales_outcomes',
  failureAuthority:'public.brain_failure_registry',
  assuranceLoop:'autonomous-outreach',
  providerPreflight:Object.freeze({
    sameProviderProjectRequired:true,
    activeConnectionRequired:true,
    mcpWordIdIsRawApiConnectedAccountId:false,
    directExecuteRequiresEntityIdentity:true,
    literalLatestVersionForbidden:true,
    structuredProviderErrorRequired:true
  }),
  recovery:Object.freeze({
    recoverableTransportErrorTerminal:false,
    gmailFallback:'canonical active Gmail connector in same sales-action lineage',
    preserve:Object.freeze(['daily-send-cap','suppression','cooldown','consent-or-existing-relationship','dedupe','republish-forbidden']),
    providerMessageThreadReadbackRequired:true
  }),
  linkedinDm:Object.freeze({
    failClosedWithoutTrueSendCapability:true,
    postOrCommentIsDm:false,
    authorizedEmailFallbackWhenKnownAddress:true
  }),
  referenceIncident:'2026-09-30'
});

export const COMMERCIAL_OUTBOUND_READBACK_P0_V1 = Object.freeze({
 fingerprint:'commercial|outbound|independent-gmail-readback|no-duplicate-retry|v1',
 issue:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198',
 owner:'ONE BRAIN / powerhouse-autonomous-outreach',
 schedulerAuthority:'NETLIFY_SUPABASE_EDGE',
 actionAuthority:'public.powerhouse_sales_actions',
 outcomeAuthority:'public.powerhouse_sales_outcomes',
 executor:'supabase/functions/powerhouse-autonomous-outreach/index.ts',
 regression:'tests/brain-commercial-independent-readback-p0-v1.test.mjs',
 invariants:Object.freeze({
   noNewScheduler:true,noParallelSender:true,consentAndSuppressionUnchanged:true,
   providerCreatedIsNotVerifiedDelivery:true,
   exactGmailMessageIdReadback:true,sentLabelRequired:true,
   recipientReadbackRequired:true,providerIdAndOutcomeLineageRequired:true,
   uncertainSendRemainsClaimed:true,uncertainSendNeverAutoResent:true,
   zeroEligibleSendsNeverGreen:true,
   publicationSlaDoesNotProveFullCommercialLoop:true,
   downstreamMeasurementsNotInferred:true
 })
});

export const COMMERCIAL_RECIPIENT_AUTHORITY_P0_V1 = Object.freeze({
 fingerprint:'commercial|gmail|trusted-crm-recipient-approval|read-only-dry-run|v1',
 issue:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198',
 owner:'ONE BRAIN / powerhouse-autonomous-outreach',
 canonicalExecutor:'supabase/functions/powerhouse-autonomous-outreach/index.ts',
 canonicalContactAuthority:'public.bg_connecties',
 canonicalActionAuthority:'public.powerhouse_sales_actions',
 regression:'tests/brain-commercial-recipient-authority-p0-v1.test.mjs',
 safety:Object.freeze({
  recipientMatchesActionAndCrm:true,
  affirmativePreparedActionApproval:true,
  affirmativeTrustedCrmApproval:true,
  unknownApprovalFailClosed:true,
  providerDispatchRequiresAuthorityBeforeClaim:true,
  missingPermissionIsTypedNonTerminalHold:true,
  dryRunNeverInvokesComposerOrProvider:true,
  preserveSuppressionPressureCooldownQualityAndIndependentReadback:true,
  zeroPreparedEmailDoesNotProveSent:true,
  publicPublicationCannotProveRecipientOutreach:true
 })
});

export const COMMERCIAL_EMAIL_CHANNEL_FAULT_ISOLATION_P0_V1 = Object.freeze({
  fingerprint:'powerhouse|commercial|independent-email-lane-within-single-scheduler|v1',
  parentIssue:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198',
  schedulerAuthority:'existing pg_cron job 116 / powerhouse-commercial-learning-v1',
  enrichment:'powerhouse_commercial_intelligence_context_stage_v1 (when graph freshness is behind)',
  normalCommercialCycle:'powerhouse_trigger_based_mkb_acquisition_cycle_v1',
  emailFallback:Object.freeze({
    condition:'normal commercial cycle raised an exception (and was rolled back)',
    prepare:'powerhouse_prepare_autonomous_outreach_v1',
    optimize:'powerhouse_optimize_prepared_outreach_v1',
    dispatch:'powerhouse_dispatch_autonomous_outreach_v1',
    actualProvider:'powerhouse-autonomous-outreach',
    noAdditionalScheduler:true,noParallelSender:true,noDuplicateDispatchOnMainCycleSuccess:true,
    recipientPermissionAndQualityUnchanged:true,providerSentReadbackRequired:true
  }),
  regression:'tests/brain-email-lane-fault-isolation-v1.test.mjs',
  migration:'supabase/migrations/20261009135700_commercial_email_lane_fault_isolation_4198.sql',
  latestObservedState:'2026-10-09: 23295 enriched; zero prepared eligible e-mail recipients; no provider-confirmed sends claimed'
});


export const MIRA_ENTREPRENEUR_PORTAL_CAPTION_CONTRACT_V1 = Object.freeze({
  fingerprint:'mira-entrepreneur-problem-to-portal-caption-v1',
  source:'config/powerhouse-problem-library.json',
  sourceType:'canonical-PH-Pxxx-problem-catalog',
  mirror:'supabase/functions/_shared/mira-entrepreneur-caption.mjs',
  generator:'supabase/functions/powerhouse-content-orchestrator/index.ts',
  mediaRouter:'supabase/functions/powerhouse-instagram-media-router/index.ts',
  singleWriter:'supabase/functions/powerhouse-social-publisher/index.ts',
  caption:['concrete-scene','source-backed-problem','potential-consequence','portal-capability-and-action','metric-and-pointe','fiction-disclosure'],
  safeguards:['one-immutable-day-winner','matching-asset-scene','real-mira-visual','exact-final-media-proof','pre-provider-validation','readback-before-live','no-fabricated-tenant-result'],
  test:'tests/brain-mira-entrepreneur-caption-v1.test.mjs',
  parentP0:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198'
});

export const MIRA_FIXED_CHARACTER_VISUAL_IDENTITY_V1=Object.freeze({
  fingerprint:'mira-master-two-image-face-continuity-v1',
  master:'config/instagram-canonical-mira-identity-v1.json',
  masterReferenceId:'Yjqu4D7v76HABNPmQPj1',
  productionDeliveryConfig:'supabase/config.toml',
  productionProofFunctions:Object.freeze(['powerhouse-instagram-media-router','powerhouse-instagram-media-verifier','powerhouse-instagram-temporal-verifier']),
  code:'supabase/functions/_shared/mira-canonical-face.mjs',
  visionTransport:Object.freeze({provider:'OpenAI',api:'Responses',adapter:'supabase/functions/_shared/mira-openai-vision.mjs',governanceUseCase:'supabase-powerhouse-instagram-media-verifier-v1',store:false}),
  sourceStages:['powerhouse-instagram-media-verifier','powerhouse-instagram-media-router','powerhouse-content-orchestrator','powerhouse-social-publisher'],
  proof:['openart-canonical-master-image-to-video','compare-master-pixels-with-final-image','video-start-middle-end-face-match','min-confidence-0.94','exact-media-sha','pre-provider-second-verification'],
  never:['user-upload-mira-identity','text-only-mira-identity-proof','new-scheduler','duplicate-provider-post'],
  acceptanceTest:'tests/brain-mira-canonical-face-consistency-v1.test.mjs',
  parentP0:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198'
});


export const MIRA_MEDIA_PREFLIGHT_WORKER_CAS_V1=Object.freeze({
  fingerprint:'mira-media-preflight-preserve-worker-cas-v1',
  router:'supabase/functions/powerhouse-instagram-media-router/index.ts',
  boundary:'supabase/functions/powerhouse-instagram-media-router/preflight-write.mjs',
  preserve:['CLAIMED','GENERATING'],
  existingRowCAS:['id','updated_at'],
  staleOutcome:'STATE_CHANGED_RETRY_BEFORE_OBLIGATION_MUTATION',
  sameCanonicalJobAndProviderHistory:true,
  proofAndPublicationAuthorityUnchanged:true,
  regression:'tests/brain-mira-media-preflight-cas-20261019.test.mjs',
  parent:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198'
});

export const PREDICTIVE_OPENAI_PUBLIC_MARKET_V1=Object.freeze({
 fingerprint:'predictive-openai-recovery-20261019',
 engine:'supabase/functions/powerhouse-predictive-engine/index.ts',
 transport:'supabase/functions/powerhouse-predictive-engine/openai-forecast.mjs',
 calibrator:'supabase/functions/powerhouse-forecast-calibrator/index.ts',
 calibrationQueueProjection:'powerhouse_public_market_calibration_due_v1 (service-role only, existing queue, public scopes before limit)',
 calibrationBoundary:'opaque source refs, two actual sources, verified ISO horizon, no unverified negative outcome or global revenue attribution',
 governanceUseCase:'supabase-powerhouse-predictive-first-mover-v1',
 provider:'OpenAI',api:'Responses',model:'gpt-5-mini',store:false,
 sourceAuthority:'existing canonical public market and search-demand signals',
 mutationAuthority:'protected main + Supabase GitHub Integration',
 privateContextExcluded:true,noAdditionalScheduler:true,noProviderFallback:true,
 independentSourcesRequired:true,realProductionReadbackRequired:true,
 regression:'tests/brain-predictive-openai-20261019.test.mjs',
 learning:'brain/learning/2026-10-19-predictive-openai-recovery.json',
 documentation:'docs/changes/2026-10-19-predictive-openai-recovery.md'
});

export const PREDICTIVE_TERMINAL_CLASSIFIER_REPLAY_V1=Object.freeze({
 fingerprint:'delivery-terminalizer-adaptive-routing-20261019',
 authority:'brain/contracts/production-readback-v1.json',
 verifierOnlyExactPath:'config/powerhouse-adaptive-delivery-v1.json',
 recovery:'existing immutable Terminal-Replay-PR4503 under Powerhouse Obligation Terminalizer',
 originalRuntimeMerge:'d64b4fa333d94b512305cc2c85da99691c88b03c',
 actualEdgeAndMigrationReadbackRequired:true,unknownRuntimeFailClosed:true,
 regression:'tests/brain-terminalizer-adaptive-routing-20261019.test.mjs',
 learning:'brain/learning/2026-10-19-predictive-terminal-classifier-replay.json',
 documentation:'docs/changes/2026-10-19-predictive-terminal-classifier-replay.md'
});

export const PREDICTIVE_UNCERTAINTY_RETENTION_V1=Object.freeze({
 fingerprint:'predictive-calibration-uncertainty-retention-20261019',
 authority:'existing revenue_learning_obligations, forecast trigger and periodic refresh',
 merge:'powerhouse_merge_calibration_obligation_v1',
 revision:'forecast ID/key/event/horizon/evidence IDs',
 preservesUnchangedAttemptAndBackoff:true,archivesInvalidatedEvidence:true,closedEvidenceImmutable:true,
 noNewQueueOrScheduler:true,noSyntheticCalibration:true,
 regression:'tests/brain-predictive-uncertainty-retention-20261019.test.mjs',
 nativeSQLFixture:'tests/supabase/predictive-uncertainty-retention-v1.sql',
 learning:'brain/learning/2026-10-19-predictive-uncertainty-retention.json',
 documentation:'docs/changes/2026-10-19-predictive-uncertainty-retention.md'
});

export const PREDICTIVE_MIGRATION_IDENTITY_PARITY_V1=Object.freeze({
 fingerprint:'predictive-production-migration-identity-parity-20261019',
 actualAppliedVersion:'20261019203052',compatibilityVersion:'20261019223000',
 sourceSha256:'f267cda0725f4020c47e4ec6511e84a4f4e527327f1b417490a80564f74fb521',
 trackingHistoryImmutable:true,providerDeploymentRequired:true,
 regression:'tests/brain-predictive-migration-history-20261019.test.mjs',
 learning:'brain/learning/2026-10-19-predictive-migration-identity-parity.json'
});

export const PREDICTIVE_UNCERTAINTY_ACK_V1=Object.freeze({
 fingerprint:'predictive-uncertainty-write-ack-timeout-20261019',
 persistence:'supabase/functions/powerhouse-forecast-calibrator/persist-uncertainty.mjs',
 refresh:'supabase/migrations/20261019210359_predictive_uncertainty_persistence_ack.sql',
 openAndSameRevisionRequired:true,acknowledgedReadbackRequired:true,
 maxPersistenceAttempts:2,modelRetry:false,unchangedRowsFilteredBeforeUpsert:true,
 regression:'tests/brain-predictive-uncertainty-persistence-20261019.test.mjs',
 learning:'brain/learning/2026-10-19-predictive-uncertainty-write-ack.json'
});


// Canonical outbound authority remains powerhouse-linkedin-sales-machine; this policy records the
// side-effect uncertainty boundary and adds no second CRM, sender, scheduler or action store.
export const SALESROBOT_UNCERTAIN_DM_DELIVERY_POLICY_20261020=Object.freeze({
 fingerprint:'commercial|linkedin-salesrobot|ambiguous-provider-send-no-resend|20261020',
 decisionAuthority:'powerhouse_sales_actions',
 executor:'powerhouse-linkedin-sales-machine',
 provider:'salesrobot',
 uncertainStatus:'waiting',
 needsIndependentReadback:true,
 republishForbidden:true,
 noAutomaticFallbackOnUnknownOutcome:true,
 regression:'tests/brain-salesrobot-linkedin-readiness-v1.test.mjs',
 learning:'brain/learning/2026-10-20-salesrobot-no-duplicate-dm.json'
});


// Live account-readiness and side-effect-free canary use the existing Powerhouse sales machine.
export const SALESROBOT_EARLY_READINESS_CANARY_20261020=Object.freeze({
 fingerprint:'commercial|salesrobot|early-truth-readonly-canary|20261020',
 authority:'powerhouse_channel_capabilities_v1',
 executionOwner:'powerhouse-linkedin-sales-machine',
 canonicalCRM:'bg_connecties',
 channels:['linkedin_dm','salesrobot.campaign_outreach'],
 preflightBeforeComposer:true,canaryMustNotMutate:true,
 permissionRequired:true,independentProviderReadback:true,
 regression:'tests/brain-salesrobot-linkedin-readiness-v1.test.mjs',
 learning:'brain/learning/2026-10-20-salesrobot-early-readiness-canary.json'
});


// Composio v3.1 execution must bind provider connected account and its owner user_id.
export const SALESROBOT_COMPOSIO_IDENTITY_TRANSPORT_20261020=Object.freeze({
 fingerprint:'commercial|salesrobot|composio-user-id-required|20261020',
 owner:'powerhouse-linkedin-sales-machine',
 transport:'/api/v3.1/tools/execute',
 requiredParameters:['connected_account_id','user_id','arguments'],
 source:'composio.connected_accounts',
 noStaticCredentials:true,
 providerReadbackRequired:true,
 regression:'tests/brain-salesrobot-linkedin-readiness-v1.test.mjs',
 learning:'brain/learning/2026-10-20-salesrobot-composio-user-id.json'
});


// One verified receipt closes the original outbound action; a provider send ACK never proves delivery.
export const SALESROBOT_PROVIDER_RECEIPT_CLOSED_LOOP_20261020=Object.freeze({
 fingerprint:'commercial|salesrobot|receipt-before-done|20261020',
 executor:'powerhouse-linkedin-sales-machine',
 actions:'powerhouse_sales_actions',
 outcomes:'powerhouse_sales_outcomes',
 providerEvents:'powerhouse_runtime_events',
 receiptEventType:'salesrobot_linkedin_dm_sent',
 requiredEvidence:['inbox_message_id','provider_prospect_uuid','provider_inbox_readback','inbox_message_sent_by_me','provider_step_status'],
 requiresRecipientCrmApproval:true,providerAckIsNotDelivery:true,
 noRetryOnAmbiguousSend:true,
 regression:'tests/brain-salesrobot-linkedin-readiness-v1.test.mjs',
 learning:'brain/learning/2026-10-20-salesrobot-receipt-before-done.json'
});

// Existing hourly assurance performs a provider-read-only SalesRobot probe; no duplicate publisher.
export const SALESROBOT_EXISTING_HOURLY_PROVIDER_PROBE_20261020=Object.freeze({
 fingerprint:'commercial|salesrobot|existing-hourly-provider-preflight|20261020',
 scheduler:'powerhouse-autonomous-outreach-assurance-hourly-v1',
 existingJobName:'powerhouse-autonomous-outreach-assurance-hourly-v1',
 edgeFunction:'powerhouse-linkedin-sales-machine',
 mode:'provider_preflight',
 capabilityRegistry:'powerhouse_channel_capabilities_v1',
 sourceOfProviderTruth:'SALESROBOT_LIST_LINKEDIN_ACCOUNTS',
 healthFields:['provider_health','payment_status','cookie_expired','execution_days_remaining','active_campaign_present'],
 noNewCron:true,noOutboundSend:true,existingRecipientApprovalPreserved:true,
 regression:'tests/brain-salesrobot-linkedin-readiness-v1.test.mjs',
 learning:'brain/learning/2026-10-20-salesrobot-existing-hourly-preflight.json'
});


export const SOCIAL_OBLIGATION_HOLD_DUPLICATE_RECOVERY_20261020=Object.freeze({
  fingerprint:'social|linkedin-personal|obligation-hold-dedupe-reconciliation|20261020',
  executor:'powerhouse-content-orchestrator',
  decisionTable:'powerhouse_channel_decisions',
  obligationTable:'content_publication_obligations',
  requirement:'unconsumed authority and no provider side effect',
  preserveGlobalUniqueness:true,noNewScheduler:true,
  regression:'tests/brain-social-preprovider-duplicate-recovery-p0-4198.test.mjs',
  learning:'brain/learning/2026-10-20-social-obligation-hold-duplicate-recovery.json'
});


export const IDENTITY_REVIEW_BOUNDED_CANONICAL_CRON_20261020=Object.freeze({
 fingerprint:'commercial|contacts|bounded-review-cron|20261020',
 existingCronName:'powerhouse-identity-graph-v1',
 finalSchedule:'2,17,32,42,47,57 * * * *',
 originalProcess:['2x 500 connection pulses','4x 500 email authority updates'],
 boundedProcess:['1x 200 connection pulse','1x 200 authority review batch'],
 dailyPerStreamTheoreticalCapacity:28800,
 independentOutreachAssuranceMinute:52,
 identityGraphHourMinute:32,
 preservesOriginalOwner:true,noNewCron:true,noSend:true,noAutoConsent:true,
 evidenceRequiresActualDailyReviewCounts:true,
 migration:'supabase/migrations/20261020114500_identity_review_bounded_cron_v1.sql',
 regression:'tests/brain-identity-review-bounded-cron-v1.test.mjs',
 learning:'brain/learning/2026-10-20-identity-review-bounded-cron.json'
});

// Bounded canonical authority review: source-backed CRM queue under heavy scheduler pressure.
export const POWERHOUSE_AUTHORITY_QUEUE_GUARD_20261020=Object.freeze({
 fingerprint:'commercial|authority|queue-preselect-skip-locked|20261020',
 migration:'supabase/migrations/20261020120000_contact_authority_bounded_queue_v2.sql',
 owner:'powerhouse_contact_authority_review_batch_v1',
 existingScheduler:'powerhouse-identity-graph-v1',
 queue:'powerhouse_connection_enrichment_state_v1',
 selectBeforeJoin:true,skipLocked:true,oneExistingCron:true,
 preservesApprovalAndSuppression:true,externalMessagesSent:0,
 learning:'brain/learning/2026-10-20-authority-queue-bounded.json'
});


export const EMAIL_LEARNING_SCOPED_REFRESH_20261020=Object.freeze({
 fingerprint:'powerhouse|email-learning-scoped-refresh|20261020',
 owner:'public.powerhouse_refresh_email_learning_stats()',
 executor:'powerhouse-email-reply-loop',
 sourceTables:['powerhouse_sales_actions','powerhouse_email_reply_events','powerhouse_sales_outcomes'],
 derivedTable:'powerhouse_email_learning_stats',
 retentionDays:180,scope:'email + exact learning contract',
 preservesOtherOwners:true,preservesSourceEvidence:true,preservesInvokerAndPrivateGrants:true,
 noNewScheduler:true,noOutboundSend:true,
 migration:'supabase/migrations/20261020174501_email_learning_stats_scoped_refresh_v1.sql',
 regression:'supabase/tests/email_learning_scoped_refresh_v1.sql',
 learning:'brain/learning/2026-10-20-email-learning-scoped-refresh.json'
});


export const DAILY_SOCIAL_BUILDER_MEDIA_RECOVERY_20261022=Object.freeze({
  fingerprint:'powerhouse|daily-social-builder-reopen-media-preflight|20261022-v1',
  owner:'existing Powerhouse content-loop, orchestrator and Instagram media router',
  existingScheduler:'NETLIFY_SUPABASE_EDGE + existing scheduled GitHub recovery',
  sourceContract:'validPersonalSource + verified AI-native builder evidence',
  safety:['no provider side effect on rebootstrap','preserve publisher proof','no duplicated media claim','no implicit email send'],
  mediaPreflight:'unchanged WAITING_ASSET probes are read-only and do not count as real attempts',
  functions:['powerhouse-content-loop','powerhouse-content-orchestrator','powerhouse-instagram-media-router'],
  regression:'tests/brain-daily-social-builder-media-recovery-20261022.test.mjs',
  learning:'brain/learning/2026-10-22-daily-social-builder-media-recovery-v1.json',
  noNewScheduler:true,noNewSender:true,noConsentBypass:true,noFabricatedProviderProof:true
});


export const PERSONAL_VERIFIED_DISTINCT_SOURCE_RESERVE_20261022=Object.freeze({
 fingerprint:'powerhouse|personal-verified-distinct-source-reserve|20261022-v1',
 owner:'powerhouse-content-orchestrator canonical unscoped bootstrap',
 source:'verified founder evidence already materialized: distinct actual event IDs and approved external URLs',
 materializer:'buildVerifiedFounderReserve in existing powerhouse-content-orchestrator',
 destination:'public.powerhouse_content_recommendations',
 existingPublisher:'powerhouse-social-publisher',
 maxAlternativesPerDay:3,
 noNewScheduler:true,noDuplicateProviderSend:true,noUnverifiedPersonalAnecdote:true,
 security:'existing service-role-only orchestrator; identity, review, uniqueness and readback unchanged',
 regression:'tests/brain-personal-distinct-source-reserve-v1.test.mjs',
 learning:'brain/learning/2026-10-22-personal-distinct-source-reserve-v1.json'
});


export const PERSONAL_HELD_DUPLICATE_REBOOTSTRAP_20261022=Object.freeze({
 fingerprint:'powerhouse|held-personal-duplicate-rebootstrap|20261022-v1',owner:'powerhouse-content-loop',
 source:'canonical content_publication_obligations plus powerhouse_channel_decisions',
 evidence:'provider unused / no side effects / known global semantic duplicate',
 retry:'reuse existing bounded powerhouse-content-orchestrator bootstrap',
 noNewScheduler:true,noNewSender:true,noUnverifiedProviderProof:true,
 tests:'tests/brain-held-personal-duplicate-rebootstrap-v1.test.mjs',
 learning:'brain/learning/2026-10-22-held-personal-duplicate-rebootstrap-v1.json'
});


export const DAILY_BLOG_SEO_MATERIAL_CLOSURE_20261022=Object.freeze({
 fingerprint:'content-publication:2026-10-22:blog|seo-question-prefix-and-closure-v1',
 original_pr:4603,owner:'existing powerhouse-daily-blog hourly reconciler',
 publisher:'tools/site-shell/publish_powerhouse_blog_artifact.py',
 focus_rule:'first contiguous substantive title words, never question prefix',
 learning:'brain/learning/2026-10-22-daily-blog-seo-closure-v1.json',
 regression:'tests/brain-powerhouse-daily-blog-seo-closure-20261022.test.mjs',
 noDuplicatePublisher:true,proof:'protected merge + public URL readback'
});


export const BLOG_NULL_CANONICAL_LINEAGE_REBIND_20261022=Object.freeze({
 fingerprint:'powerhouse|blog-null-canonical-lineage-rebind|20261022-v1',owner:'powerhouse-blog-queue',
 source:'content_publication_obligations SQL NULL original blog slug',
 fix:'old SQL NULL uses is(slug,null); genuine non-null uses exact eq(slug,old)',
 proof:'GENERATED-only CAS, no provider side effects, independent live URL readback',
 oneScheduler:true,oneBlogPR:true,noUnprovenLiveState:true,
 learning:'brain/learning/2026-10-22-blog-null-lineage-rebind-v1.json',
 regression:'tests/brain-powerhouse-blog-null-lineage-rebind-v1.test.mjs'
});


export const PERSONAL_EDITORIAL_TRUNCATION_RETRY_20261022=Object.freeze({
 fingerprint:'powerhouse|personal-editorial-truncation-bounded-retry|20261022-v1',owner:'powerhouse-content-orchestrator',
 source:'verified builder source and strict editorial revision draft',
 policy:'retry only AIProviderIncompleteOutputError, 2400 to 4800, one additional draft',
 gates:['personalEditorialViolations','personalFinalCopyValid','global semantic uniqueness','OAuth','provider receipt'],
 noSecondScheduler:true,noUnsafeProviderRetry:true,noFictitiousCopy:true,
 regression:'tests/brain-personal-editorial-truncation-retry-20261022.test.mjs',
 learning:'brain/learning/2026-10-22-personal-editorial-truncation-retry-v1.json'
});


export const LINKEDIN_PERSONAL_EXPIRED_AUTHORITY_RECOVERY_20261022=Object.freeze({
 fingerprint:'powerhouse|linkedin-personal-expired-authority-recover|20261022-v1',
 owner:'powerhouse-social-publisher',scheduler:'existing canonical Powerhouse daily loop',
 noNewSender:true,noNewScheduler:true,
 proof:['expired unused capability','zero uniqueness reservation','explicit no provider mutation','original same-date decision'],
 code:['canRecoverExpiredCompanyClaim','canRecoverExpiredPersonalClaim','recoverExpiredLinkedInPublicationAuthority'],
 tests:'tests/brain-personal-expired-publish-authority-20261022.test.mjs',
 learning:'brain/learning/2026-10-22-personal-expired-publish-authority-v1.json'
});

// 2026-10-22: diagnostic source projection only, not proof of live CLS remediation.
export const POWERHOUSE_WEBSITE_CLS_ATTRIBUTION_V1 = Object.freeze({
  contract:'powerhouse-website-mobile-cls-attribution-v1',
  fingerprint:'website|mobile-cls|en-blog-afas-api|20261022-v1',
  authority:'existing website Required browser visibility checker and Brain failure registry',
  changedSurface:'tools/site-shell/standalone-visibility-check.mjs',
  regression:'tests/brain-mobile-cls-attribution-20261022.test.mjs',
  learning:'brain/learning/2026-10-22-website-mobile-cls-attribution-v1.json',
  unchangedGate:'CLS > 0.100 fails across every public sitemap route and phone/tablet/desktop',
  incidentStatus:'OBSERVED',
  productionFixProven:false,
  existingSchedulerUnchanged:true
});

export const POWERHOUSE_GITHUB_ACTIONS_GHOST_AUTONOMY_V1 = Object.freeze({
  fingerprint:'github-actions|stale-queued-zero-jobs|bounded-self-repair-dedupe|20261022-v1',
  canonicalIncident:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4655',
  authority:'GitHub Actions provider state + existing Repository Janitor single owner',
  existingSchedule:'.github/workflows/powerhouse-repository-janitor.yml',
  fiveMinuteSupervisor:'.github/workflows/powerhouse-delivery-recovery-supervisor.yml',
  executable:'.github/scripts/github-actions-ghost-reconcile.mjs',
  regression:'tests/brain-delivery-stale-queue-janitor-v1.test.mjs',
  skill:'.agents/skills/powerhouse-continuity/SKILL.md',
  learning:'brain/learning/2026-10-22-github-actions-ghost-autonomous-reconciliation-v1.json',
  providerHardBoundary:'GitHub provider API 403/409 requires actual provider reconciliation, not a forged terminal status',
  preservesSecurityGates:true,
  noSecondScheduler:true,
  deploymentStatus:'CANDIDATE_REQUIRES_PROTECTED_MERGE_AND_PROVIDER_READBACK'
});


// 2026-10-22: existing daily learning workflow executes independent self-improvement
// even when separate source-backed AI model freshness is correctly fail-closed.
export const POWERHOUSE_DAILY_SELF_EVOLUTION_FAILURE_DOMAIN_ISOLATION_V1 = Object.freeze({
  fingerprint:'learning|daily-self-evolution|catalog-freshness-failfast|20261022-v1',
  schedule:'existing Powerhouse Daily Self Evolution (one daily cron, no replacement scheduler)',
  authority:'.github/workflows/powerhouse-daily-self-evolution.yml',
  independentJobs:Object.freeze(['improve','model-freshness']),
  providerOwner:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4367',
  providerModelClaimsAutomaticallyApproved:false,
  overallWorkflowMustStayRedWhenAuditFails:true,
  evidence:'artifacts/quality/ai-model-intelligence-audit.json',
  regression:'tests/powerhouse-daily-self-evolution.test.mjs',
  learning:'brain/learning/2026-10-22-daily-learning-provider-freshness-isolation-v1.json',
  sourceRunIds:Object.freeze([39578449326,39756866887]),
  status:'CANDIDATE_NOT_YET_PROVEN',
  noSecondScheduler:true, noWeakenedGate:true
});
