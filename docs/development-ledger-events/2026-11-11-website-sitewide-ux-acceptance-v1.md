# Website UX full-interaction evidence and normal-text contrast — 2026-11-11

Fingerprint: `website|sitewide|interaction-coverage-and-normal-text-contrast|20261111-v1`. Canonical owner: original website UX agent and protected website GitHub → Netlify writer; issues #4198/#4215; predecessor #5618. This is a handoff correction inside the existing ONE BRAIN and website delivery, not a second executor, deployer, monitor or scheduler.

## Immutable observed source
- PR #5618 protected merged main SHA `381a73637c2e607f687574517797a86907f0684c`, Netlify CURRENT/READY deploy `6af484c5d9c6f6a7b09ca75c`.
- Required run #43043865912: 277 routes × 3 viewports = **831 visibility/CLS checks**, not 831 unique click-flow tests. Eight real targeted mobile checks passed for five key routes at 320/390px, including menu, sticky header, CTA and knowledge slider. Those remain valid exact-scope proof.
- Desktop header contrast gate `tools/site-shell/v18-header-menu-contrast-check.mjs` defaults to **3:1** and logged lowest `Oplossingen` panel **3.78:1**. Until text size and calculated normal-text 4.5:1 are verified, WCAG AA ordinary-text compliance is **EVIDENCE_DUE**.
- Previous independent 404 scanner probes and provider transport bridge incident #4447 are separate and not evidence that all public interactions fail.

## Cause and permanent prevention
A source/test success or broad visibility sweep can be incorrectly promoted as sitewide interaction acceptance. The current UX agent's existing mobile proof responsibilities are retained. Added direct tasks to (1) inventory controls and prove observed action outcomes per route/selector/viewport, (2) enforce WCAG AA ordinary-text contrast in browser, and (3) hand all unproven cases back to the original website writer with correlation, owner and consumer ACK. Code-quality agent explicitly rejects false-green visibility-only claims. Existing website skill now distinguishes proof classes, forbids duplicates and requires exact production readback. Regression test protects these original projections and the distinct `EVIDENCE_DUE` states.

## Terminal criterion
The source change is **SOURCE_CANDIDATE**, not automatically live, until the protected GitHub PR merges after Required/BRAIN/CodeQL, exact current Netlify SHA is independently read and the next authentic agent/skill projection is proven. Full-site interaction and normal-text contrast acceptance stay **OPEN/EVIDENCE_DUE** until observed browser outcomes, not just this documentation/agent update.

## Protected semantic-learning gate — failed first attempt, recovered in the same PR

Original Required PR #5625 run [#43052091943](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43052091943) failed early with `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: semantic_learning`. Inspection of the original trusted guard `scripts/brain/material-writeback-closure-guard.mjs` showed that explicit semantic key `prevention` / `prevention_rule(s)` is mandatory. The candidate JSON contained human prevention prose in docs and fix fields but no top-level machine-readable prevention key. The same original PR adds a nonempty explicit `prevention` array to the Brain learning record, without modifying/waiving the admission guard. The first red run remains historical evidence; new exact-head Required and CodeQL must pass before protected merge. Source state remains CANDIDATE, not LIVE.
