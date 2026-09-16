# Powerhouse Quality Intelligence v2 — Design

**Status:** APPROVED — 2026-09-16
**Fingerprint:** `powerhouse-quality-intelligence-v2`
**Extends:** `powerhouse-quality-intelligence-v1`

## Purpose

Extend the existing deterministic Powerhouse Quality Intelligence authority so Powerhouse continuously discovers testing blind spots, explores unexpected states, learns from escaped defects and current external testing/security innovations, and optimizes test depth versus runtime/cost without creating a second QA, release, memory, analytics, or learning authority.

## Non-negotiable architecture

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- v1 remains deterministic release authority. AI/agents may discover, generate, classify, diagnose and propose; they may not waive release gates.
- Reuse `BRAIN-DELIVERY-v2`, Powerhouse Assurance, BG169, BRAIN-CLOSED-LOOP and the existing shared-learning/state-of-the-art adoption authorities.
- New machine contracts remain under existing `powerhouse/assurance/**`, `scripts/brain/**`, `tests/brain-*` and `config/**` namespaces.
- Unknown/unregistered evidence is `NOT_REGISTERED`/`UNKNOWN`, never green.
- PR path remains fast and impact-driven; expensive exploration runs scheduled/manual or when risk requires them.

## Capability 1 — Coverage Intelligence

Build a deterministic inventory of testable surfaces: public/portal/cockpit routes, API contracts, registered Supabase RPC/integration surfaces, critical functions, permissions and declared user journeys. Compare that inventory with registered test evidence. Emit explicit gap obligations with provenance, owner authority, severity/risk and evidence state. Coverage percentage alone is not sufficient evidence.

## Capability 2 — Autonomous Exploratory Testing

Add bounded browser exploration that may discover navigation/state/runtime/accessibility/layout anomalies and emit reproducible candidate tests. Exploration runs in isolated/non-destructive contexts, obeys autonomy budgets and cannot approve releases. Generated tests become release evidence only after deterministic validation and adoption into canonical tests.

## Capability 3 — Semantic Visual Intelligence

Keep existing screenshot/geometry baselines authoritative. Add a semantic defect sensor for alignment, spacing rhythm, wrapping, clipping, hierarchy, responsive composition, inconsistent component geometry and visual imbalance. AI findings are advisory until reproduced by deterministic geometry/DOM/screenshot evidence or explicitly reviewed/adopted.

## Capability 4 — Stateful, Fuzz and Chaos Testing

Exercise ordering, retries, duplicate requests, malformed inputs, token expiry, partial provider failures, stale data, timeouts, boundary payloads and registered concurrency/idempotency invariants. Production-destructive chaos is forbidden. State-machine/property tests run against safe test/preview targets or bounded mocks/containers with explicit contracts.

## Capability 5 — Production Shadow Verification

Continuously compare observed production behavior with registered contracts and SLOs using safe read/synthetic probes. Escaped defects create canonical obligations and feed the existing root-cause/regression/prevention learning loop. Shadow verification is evidence, not an alternative deployment authority.

## Capability 6 — Performance Root-Cause Intelligence

Correlate performance regressions with commit, route/endpoint, query/function and available telemetry. Experimental profiling technology is permitted only behind the existing state-of-the-art evaluation contract; alpha/frontier tooling cannot become required production authority without benchmark and rollback evidence.

## Capability 7 — Security Adversarial Matrix

Extend CodeQL/Trivy/ZAP with deterministic authorization/tenant-boundary cases: IDOR/BOLA, privilege escalation, malformed/expired identity, replay/idempotency abuse, mass-assignment-style unexpected fields, rate-limit/abuse boundaries and RLS/tenant isolation where a safe registered target exists. Fail closed when a required target is absent.

## Capability 8 — Build Provenance and SBOM

For eligible release artifacts, create supply-chain provenance/attestation bound to repository, workflow and exact commit SHA and generate/attach an SBOM. Verification becomes part of Assurance where platform support and artifact type permit it. Absence of required provenance is a release obligation, not a warning promoted to green.

## Capability 9 — Test-the-Tests Intelligence

Record deterministic test effectiveness signals: mutation sensitivity where supported, historical defect catches, flake rate, runtime, duplicate/overlap indicators and escaped-defect lineage. Never delete or weaken a critical test automatically. Optimization proposals require evidence and normal protected review.

## Capability 10 — Quality Economics

Classify tests by risk/business impact, execution cost, frequency and observed defect yield. Use this only to place tests in PR/parallel/nightly/manual lanes; security/data-integrity/tenant isolation requirements remain fail-closed regardless of cost. No opaque aggregate score may waive a red dimension.

## Learning and innovation loop

`CHANGE → IMPACT → TEST → ATTACK → EXPLORE → VERIFY → PROMOTE → PROD_READBACK/SHADOW → ESCAPED DEFECT → ROOT CAUSE → REGRESSION → TEST VALUE → LEARN → SCOUT → BENCHMARK → ADOPT/REJECT`.

External innovation scouting reuses `powerhouse-state-of-the-art-adoption-v1`: trusted sources produce candidates with provenance/freshness; candidates are benchmarked for applicability, security/privacy, false-positive rate, detection delta, speed/cost and rollback before adoption. No internet finding mutates production by itself.

## Definition of done

v2 is `LIVE & BEWEZEN` only when: contracts and validators are source-controlled; RED→GREEN regression evidence exists; existing v1 gates remain green; Required/BRAIN/Assurance exact-head checks pass; protected merge completes; current-main readback proves the v2 authority; human-readable System Map/Handbook are updated; and learning/writeback is closed. Any unavailable production target or unsupported attestation path remains an explicit obligation and prevents claims beyond the evidence actually obtained.