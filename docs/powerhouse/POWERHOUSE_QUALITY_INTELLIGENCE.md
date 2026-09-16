# Powerhouse Quality Intelligence

Canonical fingerprint: `powerhouse-quality-intelligence-v1`

## Purpose

Powerhouse Quality Intelligence is the canonical quality-control capability for the Bedrijfsgeheugen website, Portal V2, cockpit surfaces and backend Powerhouse. It extends the existing Powerhouse Assurance Layer and BRAIN-DELIVERY-v2. It is not a second release authority, QA database, visual baseline or learning store.

The governing rule is: **AI can help find and explain defects; deterministic evidence decides whether a candidate is releasable.**

## Existing authorities that remain unchanged

- Release/delivery: `BRAIN-DELIVERY-v2` and the protected `main` path.
- Production promotion: BG169.
- Shared learning/context: BG168 -> BG166 -> BG167.
- Assurance: `powerhouse-assurance-layer-v1`.
- Website semantic/navigation truth: `site/accepted-baseline.json` and `site/navigation-baseline.json`.
- Existing website visual/geometry truth: `config/ui-visual-regression.json` plus `tools/site-shell/ui-visual-regression/browser-check.mjs`.
- Runtime/data truth: existing Powerhouse/Supabase authorities.

No quality job may silently replace any of these.

## What runs on every relevant PR

`Powerhouse Quality Intelligence` runs fast deterministic checks on affected quality-control changes:

1. mandatory BRAIN chat-learning preflight;
2. Quality Intelligence contract tests;
3. machine-readable contract validation;
4. repeated core-test flake probe;
5. Hypothesis property invariants;
6. registered Schemathesis API-contract harness;
7. registered Testcontainers real-service integration harness;
8. Trivy repository vulnerability/secret/misconfiguration observation.

The existing website release lane remains responsible for its accepted baseline, Chromium visual geometry, CLS, overflow, page semantics, route and SEO protections. Quality Intelligence deliberately reuses those controls rather than creating a second screenshot baseline.

## Deep frontend quality

The scheduled/manual frontend audit uses Playwright across Chromium, Firefox and WebKit and the viewport registry already used by the visual system. It detects:

- browser-specific breakage;
- navigation failures;
- JavaScript page errors;
- console errors;
- failed requests;
- same-origin HTTP 4xx/5xx responses;
- unexpected horizontal overflow;
- basic keyboard-focus failure;
- serious and critical axe accessibility violations;
- excessive navigation time;
- screenshots and JSON evidence for failures.

This is additive to the existing pixel/geometry/CLS guard. A future component framework may add Vitest Browser Mode or Storybook component tests when the repository actually has reusable framework components; they are not introduced merely to satisfy a tooling list.

## Backend quality

The backend dimensions are machine-readable in `powerhouse/assurance/quality-intelligence.json`:

`functional, property, api_contract, integration, performance, security, supply_chain, misconfiguration, resilience, data_integrity`.

Current adapters:

- **Property testing:** Hypothesis runs repository invariants now.
- **API adversarial testing:** Schemathesis capability is installed. It only executes against a specifically registered OpenAPI target. With no target, the test reports `NOT_REGISTERED`; that is an obligation, not production proof.
- **Real-service integration:** Testcontainers capability is installed. A registered `QUALITY_INTEGRATION_PROFILE=postgres` starts a real PostgreSQL container and executes `SELECT 1`. With no integration profile, this remains `NOT_REGISTERED` rather than simulated green evidence.
- **Performance/SLO:** scheduled/manual k6 executes public synthetic route checks with explicit error-rate and p95/p99 thresholds.

Additional API and integration profiles must be explicit, bounded and tenant-safe. They may not infer credentials or mutate production data.

## Security quality

Security is independent of functional correctness.

- CodeQL analyzes JavaScript/TypeScript with `security-extended` queries.
- Trivy observes repository vulnerabilities, secrets and misconfiguration and preserves JSON evidence.
- ZAP runs a passive baseline against the public website only on scheduled/manual deep runs.
- Existing Supabase RLS, tenant and platform security gates remain mandatory.

A green application test never cancels a security finding. AI cannot waive a security gate.

Trivy is initially an evidence sensor (`--exit-code 0`) rather than a new blanket blocking gate because an unbaselined repository-wide scan can contain historical findings unrelated to the candidate. Promotion to a blocking delta gate requires a reviewed baseline and proof that the gate has an acceptable false-positive rate. This prevents both security theatre and accidental normalization of legacy findings.

## Mutation and flake intelligence

`repeat-flake-check.mjs` repeats the deterministic core suite and compares outcomes. An inconsistent outcome is `flaky`, not a successful retry. An all-red repetition remains red. No repeated execution may convert an unexplained red into green.

Stryker mutation testing runs on the scheduled/manual deep path against the deterministic Quality Intelligence core. Mutation score demonstrates whether tests detect changed behavior; it never replaces functional, security or production evidence.

## Performance and speed strategy

The quality layer is intentionally two-speed:

- **PR path:** fast deterministic contract/property/security sensors and the pre-existing affected release lanes.
- **Deep path:** cross-browser matrix, mutation, passive DAST, k6 and innovation scouting on schedule/manual runs.

`classifyQualityImpact()` maps changed paths to relevant suites. Expensive tests are selected from declared impact, not by blindly running the entire estate for every small change. Existing independent delivery lanes remain parallel where contracts do not overlap.

## Explainable release evidence

There is no global opaque AI quality score. Each dimension records:

- dimension ID;
- mandatory/non-mandatory state;
- green/red/unknown state;
- exact candidate SHA;
- evidence/artifact reference;
- test/tool/version provenance.

`buildQualityState()` is fail-closed: any mandatory non-green dimension blocks its quality state.

## Escaped defects and learning

A defect found in CI, preview or production is not merely fixed. It follows the existing BRAIN-CLOSED-LOOP path:

`detect -> evidence -> normalize -> fingerprint -> known-error match -> owner -> root cause -> regression test -> bounded fix -> retest -> outcome verification -> BG168/BG166 writeback -> BG167 refresh -> prevention reuse`.

At minimum an escaped defect needs `fingerprint`, `rootCause`, `regressionTest`, `preventionRule`, `evidence`, learning writeback and shared-context refresh. Quality Intelligence never creates a second persistent defect memory.

## Daily innovation scout

`powerhouse/assurance/quality-innovation-sources.json` contains approved primary sources for Playwright, axe-core, Web Vitals, OWASP/ZAP, CodeQL, Trivy, Hypothesis, Schemathesis, Testcontainers, k6 and Stryker.

The daily scout records HTTP state, ETag/Last-Modified where available and a SHA-256 content fingerprint. A changed source becomes only `candidate_for_experiment`.

Adoption is deliberately gated:

`discover -> dedupe -> applicability -> security/cost review -> isolated benchmark -> false-positive check -> defect-detection delta -> speed delta -> experiment result -> explicit adoption`.

A new release, fashionable technique or AI-generated suggestion is never automatically promoted into release authority.

## Versions at introduction

The initial pinned tool versions are recorded in the workflow rather than inferred at runtime: Playwright `1.63.0`, `@axe-core/playwright` `4.13.0`, Stryker `10.0.0`, Trivy `0.74.0`, k6 `2.2.0` and ZAP `2.17.0`. CodeQL uses the current GitHub-documented `github/codeql-action@v4` major. The innovation scout may identify newer candidates, but changes still require the adoption gates above.

## Adding a new quality target

For an API:

1. register a stable OpenAPI specification location;
2. set `QUALITY_OPENAPI_SPEC` only in a controlled CI/runtime context;
3. run Schemathesis and preserve evidence;
4. promote the target to mandatory only after the target is deterministic and safe.

For a real-service integration:

1. register the integration profile and image/version;
2. keep credentials synthetic/local;
3. use Testcontainers rather than a mocked remote service where practical;
4. add domain assertions beyond mere container startup;
5. preserve execution evidence.

For a frontend surface:

1. reuse the existing route/visual registries where possible;
2. add the route to the appropriate accepted baseline and interactions;
3. declare relevant viewports/guards;
4. add a deep-browser route only when it represents a meaningful user journey.

## Status semantics

- `GREEN` for the Quality Intelligence core means all mandatory deterministic dimensions supplied to that quality-state evaluation are green.
- `NOT_REGISTERED` means a capability exists but no authoritative target has been registered. It is not green evidence.
- Scheduled sensors are not retroactively evidence for a different candidate SHA.
- A CI success does not by itself prove provider/runtime production outcomes.
- `LIVE & BEWEZEN` remains governed by the wider Powerhouse truth/status and Assurance contracts.

## Hard boundaries

Quality automation may not:

- create or rotate secrets/credentials;
- weaken authentication, RLS, branch protection or other security controls;
- run destructive production recovery/security tests merely to gain coverage;
- auto-purchase scanners/resources;
- infer production success from a skipped/unregistered test;
- auto-adopt an Internet-discovered tool/version without evidence.

## Operational files

- Contract: `powerhouse/assurance/quality-intelligence.json`
- Innovation sources: `powerhouse/assurance/quality-innovation-sources.json`
- Core: `scripts/powerhouse-quality-intelligence.mjs`
- Frontend deep audit: `scripts/quality/frontend-deep-audit.mjs`
- Flake probe: `scripts/quality/repeat-flake-check.mjs`
- Innovation scout: `scripts/quality/innovation-scout.mjs`
- Core tests: `tests/powerhouse-quality-intelligence.test.mjs`
- Backend properties/API/integration: `tests/backend/`
- Performance: `tests/performance/powerhouse-smoke.js`
- Mutation config: `stryker.quality.conf.json`
- Main quality workflow: `.github/workflows/powerhouse-quality-intelligence.yml`
- SAST workflow: `.github/workflows/powerhouse-codeql.yml`

## Change closure

A Quality Intelligence change follows the same Powerhouse closure chain as any structural change:

`current state -> known learning -> failing regression/contract test -> minimal implementation -> exact-head CI -> protected merge -> current-main readback -> scheduled/runtime evidence where applicable -> documentation -> material learning/writeback when a real defect/recovery/contract change occurred`.

A feature is never called complete merely because code exists on a branch.