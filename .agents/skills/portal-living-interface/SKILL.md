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
