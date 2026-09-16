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
2. Quality Intelligence v1 and v2 contract tests;
3. machine-readable contract validation;
4. repeated core-test flake probe;
5. Hypothesis property invariants;
6. registered Schemathesis API-contract harness;
7. registered Testcontainers real-service integration harness;
8. Trivy repository vulnerability/secret/misconfiguration observation.

The existing website release lane remains responsible for its accepted baseline, Chromium visual geometry, CLS, overflow, page semantics, route and SEO protections. Quality Intelligence deliberately reuses those controls rather than creating a second screenshot baseline.

## Quality Intelligence v2 extension

`powerhouse-quality-intelligence-v2` is an extension contract, not a new release authority. v1 remains the deterministic release authority. The v2 contract adds ten capabilities: coverage intelligence, bounded autonomous exploration, semantic visual intelligence, stateful/fuzz/chaos testing, production shadow verification, performance root-cause intelligence, the security adversarial matrix, build provenance/SBOM, test-the-tests intelligence and quality economics.

Evidence states are explicit: `GREEN`, `RED`, `UNKNOWN`, `NOT_REGISTERED`. Only `GREEN` is green. `UNKNOWN` and `NOT_REGISTERED` always remain obligations when a required surface depends on them. AI-generated or exploratory findings are `candidate_finding` records and have no release authority until deterministic reproduction/adoption exists.

Coverage Intelligence compares `config/powerhouse-quality-surfaces.json` with registered evidence and emits covered surfaces, gaps, unknown states and canonical obligations. It never substitutes a coverage percentage for evidence.

Bounded exploration uses `scripts/brain/quality/exploration-policy.mjs`. Destructive actions such as delete, publish, deploy, merge, purchase and outbound send are forbidden. Exploration is step-budgeted; candidate findings remain advisory. The existing Playwright deep frontend sensor is reused for scheduled/manual browser exploration and semantic/geometry evidence rather than introducing a second browser authority.

The adversarial matrix in `config/powerhouse-quality-adversarial-matrix.json` registers safe cases for retry, idempotency, ordering, malformed/expired identity, tenant boundaries, replay, unexpected fields, rate limits and provider failure. Missing registered targets resolve to `NOT_REGISTERED`; production-destructive chaos is forbidden.

Production shadow normalization in `scripts/brain/quality/production-shadow.mjs` converts contract/SLO drift into `RED` escaped-defect obligations that reuse `BRAIN-CLOSED-LOOP-v1` and BG169. Missing observations remain `UNKNOWN`.

Quality economics in `scripts/brain/quality/test-economics.mjs` can recommend PR, parallel or nightly placement using risk, runtime and observed yield. It cannot waive a gate. Security, data-integrity and tenant-isolation tests remain fail-closed regardless of cost; unknown yield is not interpreted as zero risk.

The scheduled/manual provenance lane creates an exact-SHA subject artifact, generates a CycloneDX SBOM and uses GitHub artifact attestation. This is additive supply-chain evidence for the eligible Quality Intelligence artifact and does not convert unsupported/unavailable provenance elsewhere into green.

## Deep frontend quality

The scheduled/manual frontend audit uses Playwright across Chromium, Firefox and WebKit and the viewport registry already used by the visual system. It detects browser-specific breakage, navigation failures, JavaScript/console errors, failed requests, same-origin HTTP errors, horizontal overflow, keyboard-focus failure, serious/critical axe violations and bounded navigation-time regressions. Failure screenshots and JSON evidence are retained as workflow artifacts.

This is additive to the existing pixel/geometry/CLS guard. A future component framework may add Vitest Browser Mode or Storybook component tests when the repository actually has reusable framework components; they are not introduced merely to satisfy a tooling list.

## Backend quality

The backend dimensions are machine-readable in `powerhouse/assurance/quality-intelligence.json`:

`functional, property, api_contract, integration, performance, security, supply_chain, misconfiguration, resilience, data_integrity`.

Current adapters:

- **Property testing:** Hypothesis runs repository invariants now.
- **API adversarial testing:** Schemathesis executes only against a registered `QUALITY_OPENAPI_SPEC`. Without a target, the capability reports `NOT_REGISTERED`; that is an obligation, not production proof.
- **Real-service integration:** Testcontainers executes a real PostgreSQL container when `QUALITY_INTEGRATION_PROFILE=postgres` is registered. Without a profile, it remains `NOT_REGISTERED` rather than simulated green evidence.
- **Performance/SLO:** scheduled/manual k6 executes public synthetic route checks with explicit error-rate and p95/p99 thresholds.

Additional API and integration profiles must be explicit, bounded and tenant-safe. They may not infer credentials or mutate production data.

## Security quality

Security is independent of functional correctness. CodeQL analyzes JavaScript/TypeScript, Trivy observes vulnerabilities/secrets/misconfiguration, and ZAP runs a passive baseline against the public website only on scheduled/manual deep runs. Existing Supabase RLS, tenant and platform security gates remain mandatory. AI cannot waive a security gate.

Trivy is initially an evidence sensor (`--exit-code 0`) rather than a new blanket blocking gate because an unbaselined repository-wide scan can contain historical findings unrelated to the candidate. Promotion to a blocking delta gate requires a reviewed baseline and acceptable false-positive evidence.

## Mutation and flake intelligence

`repeat-flake-check.mjs` repeats the deterministic core suite and compares outcomes. An inconsistent outcome is `flaky`, not a successful retry. An all-red repetition remains red. No repeated execution may convert an unexplained red into green.

Stryker mutation testing runs on the scheduled/manual deep path against the deterministic Quality Intelligence core. Mutation score demonstrates whether tests detect changed behavior; it never replaces functional, security or production evidence.

## Performance and speed strategy

The quality layer is intentionally two-speed:

- **PR path:** fast deterministic contract/property/security sensors and the pre-existing affected release lanes.
- **Deep path:** cross-browser matrix, adversarial matrix, mutation, passive DAST, k6, exact-SHA SBOM/provenance and innovation scouting on schedule/manual runs.

`classifyQualityImpact()` maps changed paths to relevant suites. Expensive tests are selected from declared impact, not by blindly running the entire estate for every small change. Existing independent delivery lanes remain parallel where contracts do not overlap.

## Explainable release evidence

There is no opaque global AI quality score. Each dimension records dimension ID, mandatory state, green/red/unknown state, exact candidate SHA, evidence/artifact reference and tool/version provenance. `buildQualityState()` is fail-closed: any mandatory non-green dimension blocks its quality state.

## Escaped defects and learning

A defect found in CI, preview or production follows the existing BRAIN-CLOSED-LOOP path:

`detect -> evidence -> normalize -> fingerprint -> known-error match -> owner -> root cause -> regression test -> bounded fix -> retest -> outcome verification -> BG168/BG166 writeback -> BG167 refresh -> prevention reuse`.

At minimum an escaped defect needs `fingerprint`, `rootCause`, `regressionTest`, `preventionRule`, `evidence`, learning writeback and shared-context refresh. Quality Intelligence never creates a second persistent defect memory.

## Daily innovation scout

`powerhouse/assurance/quality-innovation-sources.json` contains approved primary sources for Playwright, axe-core, Web Vitals, OWASP/ZAP, CodeQL, Trivy, Hypothesis, Schemathesis, Testcontainers, k6 and Stryker. The daily scout records HTTP state, ETag/Last-Modified where available and a SHA-256 content fingerprint. A changed source becomes only `candidate_for_experiment`.

Adoption remains gated:

`discover -> dedupe -> applicability -> security/cost review -> isolated benchmark -> false-positive check -> defect-detection delta -> speed delta -> experiment result -> explicit adoption`.

A new release, fashionable technique or AI-generated suggestion is never automatically promoted into release authority.

## Versions at introduction

Pinned workflow versions: Playwright `1.63.0`, `@axe-core/playwright` `4.13.0`, Stryker `10.0.0`, Trivy `0.74.0`, k6 `2.2.0`, ZAP `2.17.0` and Syft `1.33.0`. CodeQL uses `github/codeql-action@v4`. Newer candidates still pass the adoption gates above.

## Status semantics

- `GREEN` for the Quality Intelligence core means all mandatory deterministic dimensions supplied to that quality-state evaluation are green.
- `NOT_REGISTERED` means a capability exists but no authoritative target has been registered. It is not green evidence.
- `UNKNOWN` means evidence is missing or insufficient. It is not green evidence.
- Scheduled sensors are not retroactively evidence for a different candidate SHA.
- A CI success does not by itself prove provider/runtime production outcomes.
- `LIVE & BEWEZEN` remains governed by the wider Powerhouse truth/status and Assurance contracts.

## Hard boundaries

Quality automation may not create/rotate secrets, weaken authentication/RLS/branch protection, run destructive production tests merely for coverage, auto-purchase resources, infer success from skipped/unregistered tests, or auto-adopt Internet-discovered tooling without evidence.

## Operational files

- v1 contract: `powerhouse/assurance/quality-intelligence.json`
- v2 extension contract: `powerhouse/assurance/quality-intelligence-v2.json`
- Surface inventory: `config/powerhouse-quality-surfaces.json`
- Adversarial matrix: `config/powerhouse-quality-adversarial-matrix.json`
- Innovation sources: `powerhouse/assurance/quality-innovation-sources.json`
- Core: `scripts/brain/powerhouse-quality-intelligence.mjs`
- Coverage Intelligence: `scripts/brain/quality/coverage-intelligence.mjs`
- Exploration policy: `scripts/brain/quality/exploration-policy.mjs`
- Production shadow: `scripts/brain/quality/production-shadow.mjs`
- Quality economics: `scripts/brain/quality/test-economics.mjs`
- Impact selection: `scripts/brain/quality/changed-impact.mjs`
- Frontend deep audit: `scripts/brain/quality/frontend-deep-audit.mjs`
- Flake probe: `scripts/brain/quality/repeat-flake-check.mjs`
- Innovation scout: `scripts/brain/quality/innovation-scout.mjs`
- Core tests: `tests/brain-quality-intelligence.test.mjs` and `tests/brain-quality-*.test.mjs`
- Backend properties/API/integration: `tests/brain-quality/`
- Performance: `tests/brain-quality-performance/powerhouse-smoke.js`
- Mutation config: `config/stryker.quality.conf.json`
- Main quality workflow: `.github/workflows/powerhouse-quality-intelligence.yml`
- SAST workflow: `.github/workflows/powerhouse-codeql.yml`

These paths deliberately sit inside existing BRAIN/backend/config namespaces so BRAIN-DELIVERY-v2 classifies them through the existing canonical lanes rather than requiring a parallel delivery authority.

## Change closure

A Quality Intelligence change follows the same Powerhouse closure chain as any structural change:

`current state -> known learning -> failing regression/contract test -> minimal implementation -> exact-head CI -> protected merge -> current-main readback -> scheduled/runtime evidence where applicable -> documentation -> material learning/writeback when a real defect/recovery/contract change occurred`.

A feature is never called complete merely because code exists on a branch.
