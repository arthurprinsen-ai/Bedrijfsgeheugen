# Powerhouse Quality Intelligence v1 — Design

Fingerprint: `powerhouse-quality-intelligence-v1`

## Goal
Extend the existing Bedrijfsgeheugen Powerhouse Assurance and BRAIN-DELIVERY-v2 control plane with one canonical, explainable quality-intelligence layer for website, portal, cockpit and backend. It must detect defects earlier, run faster by impact, learn from escaped defects and current engineering innovations, and never replace deterministic release evidence with AI judgement.

## Non-negotiable constraints
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- Reuse `powerhouse/assurance`, `config/ui-visual-regression.json`, the existing website/browser lane, BRAIN-DELIVERY-v2, BG166/BG167/BG168/BG169 and `config/universal-closed-loop-learning.json`.
- No parallel QA database, learning store, release authority or second visual baseline.
- AI/agents may discover, generate tests, classify, root-cause and propose/heal bounded defects; only deterministic evidence may pass release gates.
- Never weaken accepted website baselines, security controls, tenant isolation, or exact-candidate production proof.

## Architecture
`change -> quality impact map -> fast deterministic contract tests -> affected deep tests -> preview/runtime evidence -> exact candidate promotion -> production synthetics/readback -> escaped-defect learning -> regression/prevention reuse`

The layer is a control plane over existing tests. It owns a machine-readable contract, a deterministic validator/impact mapper, a frontend runtime/a11y/cross-browser auditor, backend quality adapters, flake and mutation checks, security/performance jobs, and an innovation scout. Evidence is written as CI artifacts and material failures/repairs continue through the existing Powerhouse learning lineage.

## Frontend quality
The existing Chromium geometry/CLS/visual-regression engine remains canonical for layout geometry. Quality Intelligence adds Chromium/Firefox/WebKit runtime verification, console/page errors, failed/4xx/5xx critical requests, accessibility with axe, keyboard-focus sanity, overflow and responsive checks, and bounded performance budgets. Website, Portal V2 and cockpit-like internal surfaces are mapped by impact rules; existing accepted semantic/navigation baselines remain release blocking.

## Backend quality
Backend quality dimensions are functional, property, API contract/adversarial, integration, performance/SLO, security, supply chain, misconfiguration, resilience and data integrity. Property testing uses Hypothesis. OpenAPI-backed APIs may use Schemathesis when a registered spec exists. Testcontainers is the preferred real-service integration mechanism when a component registers an integration profile. Absence of a registered target is reported as an explicit capability obligation; it is never presented as executed production proof.

## Security
CodeQL, Trivy filesystem/config/secret/dependency scanning and passive OWASP ZAP are independent sensors. Security findings cannot be waived by AI. Existing Supabase/RLS security gates remain authoritative and additive.

## Speed
Change impact selects expensive suites only for affected surfaces. CI runs independent jobs in parallel, reuses package/browser caches where safe and keeps nightly full-fleet tests separate from PR fast paths. Flake detection distinguishes deterministic failures from inconsistent repetitions; retries never turn an unexplained red into green.

## Mutation testing
Critical deterministic quality/control-plane logic is mutation-tested on a scheduled/manual deep-quality path. Mutation score is evidence that tests detect changed behavior, not a substitute for functional or production proof.

## Learning
Every escaped defect follows the existing BRAIN-CLOSED-LOOP lifecycle: detect -> evidence -> fingerprint -> known-error match -> root cause -> regression test -> fix -> retest -> outcome verification -> BG168/BG166 writeback -> BG167 refresh -> prevention reuse. The layer creates no second memory.

## Innovation scout
A daily scout checks approved primary sources for testing, browser, accessibility, performance and security changes. A new technique/version follows `discover -> dedupe -> applicability -> security/cost review -> isolated benchmark -> false-positive/defect-detection/speed comparison -> experiment result -> explicit adoption`. It never auto-upgrades production tooling merely because a new version exists.

## Explainable quality state
No opaque global AI score is allowed. Evidence is reported per dimension with state, threshold, provenance, candidate SHA, tool/version and artifact reference. Overall release status is derived from mandatory deterministic gates and production evidence.

## Definition of done
The capability is complete only when its contract and validator are enforced in CI, frontend deep checks and backend quality adapters are executable, daily innovation scanning is scheduled, security/performance/mutation/flake paths are present, Assurance knows the capability, documentation is current, required checks pass on exact candidate SHA, protected merge succeeds, and current-main readback proves the artifacts are present.