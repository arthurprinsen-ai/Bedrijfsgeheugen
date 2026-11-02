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
