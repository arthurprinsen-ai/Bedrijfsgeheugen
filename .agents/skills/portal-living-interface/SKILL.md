---
name: portal-living-interface
description: Canonical Portal V2 visual design, chart accessibility, safe fields, entrepreneur experience and learning.
---

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1

# Portal Living Business Interface — original V2 only
Version: 2026-11-02-v1. Owner: original Portal V2 UX and single protected release owner. Parent: #4547.

## Mission
Make the existing entrepreneur portal compelling, legible and effortless. Prioritize entrepreneur task completion, informed decisions and trust over novelty, animation or speculative claims. One UI/UX design system; never add a parallel portal, brain, read model, action scheduler, writer, tenant identity or fake demo KPI.

## Engineering rules
- Build atop `portal-v2/` and its original InsightLens and route registry. Progressive disclosure for complex details; graphs have precise source-derived tabular alternatives and mouse/touch/keyboard parity.
- Real user inputs must use native labels, required state, constraints, readable validation and explicit server confirmation; **never** show saved/success from merely typing.
- No zero substitution for unknown source facts in new visual disclosures; preserve unknown, stale, scenario and measured as separate statuses. No simulated customer outcome.
- Require WCAG 2.2 AA review, actual keyboard and screenreader trials, 320/390/768/1024/1440 screenshot checks, 200% zoom, contrast, reduced-motion, Core Web Vitals p75 and 2-tenant auth tests before claiming complete.
- Adoption goals are targets only: 90% unaided tasks, SUS >=85, median first useful decision <60s, LCP <=2.5s, INP <=200ms, CLS <=0.1. Measure actual baselines before declaring achievement.
- Preserve protected Required/CodeQL/BRAIN, source SHA, deployment readback and authorized production owner. Never set green by bypassing tests.

## Learning loop
Issue #4547 is the canonical parent. Each defect: record route, control, viewport, source/tenant, expected/observed, impact, root cause, corrective change, regression test, owner, independent readback, recurrence-prevention check and measured entrepreneur outcome. Keep failed acceptance EVIDENCE_DUE and reflect it in existing portal/ONE BRAIN under the original integration, never invent an external log.

## Delivery preflight learning
Before opening a PR, use the canonical supported Candidate-Type `implementation` for feature work; `feature` is rejected. Required admission must fail closed. Do not retry stale head workflow checks or change approved policy to silence the error.

## CodeQL security-gate learning
Never use naive case-sensitive forbidden-tag regex assertions as proof of HTML escaping. Supply adversarial mixed-case markup input, assert canonical entity-encoded output, and require a fresh exact-head CodeQL result. Two high test-filter findings on original #5297 are not waived or marked green by correcting test code alone.

## Live UX and Netlify browser gate recurrence — 2026-11-02
The V1 design foundation is source+browser verified live in PR #5297, Netlify deploy `6ae89037cf6564e024183391`, SHA `75c4500a4e90afa1f001f748d7081a75e09aa803` (15 pass, 1 intentional skip). That does NOT prove full WCAG 2.2 AA, authenticated two-tenant outcomes, usability targets or award readiness. For an intermittent Netlify HTTP 403 challenge during a production browser test, reuse the original bounded browser-gate skill and canonical ONE BRAIN incident family `powerhouse|portal-v2|first-browser-readback-403-then-pass|20261030-v1`; never bypass security, never call a challenged response a product PASS, and require independent exact-SHA successful browser readback.

## Operator UX evidence, original admin-only System Map
The existing `/api/powerhouse-observability` authenticated administrator projection now reads only the latest `brain_observed_states` record for `portal-v2-living-interface-ux-v1` through the original Supabase service read. The server returns a small allowlisted summary (never raw evidence, token, tenant, customer, fingerprint or unfiltered errors). The existing System Map shows it as `data-portal-ux-proof`; a recorded live release can be technically confirmed only when the current independent Netlify published SHA matches its observed production SHA. If sources are stale, inaccessible or inconsistent, show UNVERIFIED/PRODUCTION_SOURCE_RECHECK_DUE, not fabricated green. WCAG/tenant/user-task/award statuses stay EVIDENCE_DUE until genuine evidence. Preserve noindex, no-store, original admin and tenant gates, and require real authenticated operator readback after deploy.

## Original admin evidence expansion: legacy test oracle recurrence
- Incident fingerprint: `portal|brain-postmerge|legacy-failure-coverage-exact-systemmap-shape|20261102-v1`. Original PR #5308 safely added `portalUxReleaseProof` to the admin-only `systemMap`; older `tests/brain-portal-failure-coverage-readback-20261029.test.mjs` still asserted the exact *closed* object literal. The first original postmerge BRAIN run #41463765668 failed test #3029; do not hide it or change secure runtime to satisfy an obsolete test.
- Before a protected Portal/ONE BRAIN delivery, inventory **all source-contract assertions referencing the modified server projection**, update old test oracles to explicitly require the current extended projection, and independently assert `isPowerhouseAdmin`, `resolveIdentityTenant`, the original incident aggregate, the additional allowlisted UX proof, private/no-store response and fail-closed UNKNOWN statuses. Do not replace exact security assertions with permissive wildcards.
- Reuse original recovery PR #5312, `brain/learning/2026-11-02-portal-admin-ux-test-source-contract-recovery-v1.json` and existing ONE BRAIN occurrence. The independently completed postmerge run #41465927780 backend job #125347160483 had **5,440 PASS, 0 FAIL, 2 SKIP**; this proves the source test no longer fails, not authenticated admin browser rendering, WCAG compliance, tenant usability or customer results. The skill must be applied in the next natural owner run and independently read back before declaring prevention PROVEN.

## Exact latest ONE BRAIN UX production-state contract — no false green (2026-11-02)
The production state observation `portal-v2-living-interface-20261102-1451-e9afb69-source-deploy-admin-readback-due` is more recent than the historical V1 browser proof and correctly states `SOURCE_DEPLOYED_AUTHENTICATED_ADMIN_READBACK_DUE` / `PUBLISHED_SOURCE_VERIFIED_BROWSER_READBACK_DUE`. Accept these exact statuses in the admin-only allowlisted server view, and compare the registered production SHA against independently published Netlify SHA in the original System Map. A match means **source deployed**, never **the new protected admin card was visibly tested**. The original browser PASS_15_SKIPPED_1 is historical release evidence only. Display a caution badge until an actual authorized admin session reads and renders the card; tenant/2-tenant/WCAG/usability remain EVIDENCE_DUE. Preserve origin incident, source timestamps, no-store/noindex, identity+tenant boundary and machine regression on this exact production-observed state. Do not repair by fabricating evidence or disabling guards.

## ONE BRAIN failure-maturity writeback after actual recovery (2026-11-02)
- A successful GitHub merge, CodeQL test and Netlify deploy do **not** automatically close the original `brain_failure_registry` incident. Read the exact original fingerprint + version from Supabase before any maturity change.
- For a source/contract fix verified by protected exact-SHA tests, the canonical provider release and the original ONE BRAIN regression, call the existing **version-checked** `public.brain_promote_failure(p_fingerprint, p_expected_version, ...)` to record verified root cause, scoped fix, regression reference and a concrete recurrence-prevention rule. Promote `OBSERVED → VALIDATED` only when that source and regression evidence is genuine, preserve existing evidence/history, then independently read back the registry version, fields and maturity.
- `VALIDATED` means the software fix and preventive test have been shown; do **not** promote `VALIDATED → PROVEN` or claim whole-platform green until independent **authenticated admin browser readback** has rendered the live status card with real production SHA, and the original owner has proved the next natural agent/skill application and relevant acceptance evidence. The recurring WAF HTTP403 and unrelated incident families retain their original status.
- On `FAILURE_VERSION_CONFLICT`, stale source identity, missing test, expired observation or ambiguous evidence: HOLD and re-read original state. No direct unsafe SQL UPDATE of maturity, no waiver/bypass and no new incident store or scheduler. The original portal admin System Map must show the changed maturity only after its existing aggregate source refresh; database readback alone is not proof the card was rendered.
- Concrete regression: original fingerprint `portal|living-interface|newer-source-deployed-status-falls-through-allowlist|20261102-v1` was `OBSERVED` v1 despite source fix #5313. On 2026-11-02, original Supabase RPC returned `VALIDATED` v2 with exact root cause, regression `tests/brain-portal-ux-admin-proof-readback-20261102.test.mjs`, independent Netlify READY/source SHA, and `admin_browser_readback=EVIDENCE_DUE`; neither the original #4547 issue nor the independent WAF issue is thereby closed.
