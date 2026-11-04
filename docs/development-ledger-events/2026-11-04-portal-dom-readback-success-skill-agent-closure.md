# Portal V2 exact-production DOM readback — verified closure (2026-11-04)

Owner: original Portal V2 UX/release agent and canonical protected delivery pipeline.

## Independent provider evidence
- Netlify ready deploy `6aeb82327b0f598f2a87721a`, published SHA `4d5823446c3b830e9b33b0314893cdd56dc5b5ee`.
- Original GitHub Portal V2 Production DOM Readback workflow run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41895447111 completed SUCCESS on that exact SHA. Hydrated mobile DOM, visual regression, immutable release recheck and browser evidence upload passed; two baseline steps were intentionally skipped.
- Previous run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41870321825 expected obsolete SHA `223bf311164966ac2ab7d62c5bfa71b6941e7fa8` and failed its exact-deploy wait before browser assertions. This was stale-run SHA drift, not evidence of a mobile product defect.

## Required original agent/skill recurrence rule
Before production browser acceptance, read the actual current Netlify published SHA, dispatch the **existing** original workflow on `main` using the approved PR number and exact `production_sha`, then independently compare run SHA, browser job success, uploaded evidence and still-current published SHA. Never rerun an obsolete run to prove a new release. A mismatch is `STALE_RUN_SHA` and `EVIDENCE_DUE`, not a product PASS. Preserve protected CI/CodeQL/BRAIN, original owner, canonical ONE BRAIN incident register and exclusive writer. No parallel executor or waiver.

Technical DOM PASS does not prove unaided entrepreneur usability, authenticated two-tenant tasks, WCAG 2.2 AA, SUS or design-award readiness. Keep those acceptance obligations open until measured. Native ONE BRAIN and portal writeback plus next natural agent application require separate provider proof before claiming fully operationalized prevention.
