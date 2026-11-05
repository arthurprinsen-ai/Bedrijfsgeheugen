# Portal V2 fresh-production identity — same-lineage development event

Date: 2026-11-05  
Owner: original Portal V2 UX/Engineering and protected release owner  
Status: SOURCE_FIX_COMMITTED_CI_PENDING; PRODUCTION_EVIDENCE_DUE  
Fingerprint: `portal|production-readback|fresh-published-sha-skill-trigger|20261105-v1`  
Original issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547  
Original-owner PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5432

## Observed source and provider problem
The original skill did not explicitly require the CURRENT published Netlify identity before EVERY production browser acceptance; the original workflow's `on.push.paths` omitted skill-only changes. A previously successful browser result is historically valid, not proof of subsequent automatic owner application. Netlify last observed READY deploy `6aeb82327b0f598f2a87721a` corresponds to older SHA `4d5823446c3b830e9b33b0314893cdd56dc5b5ee` while GitHub main advanced through protected Supabase source updates, so the original source-only allowlist cannot safely accept stale production.

## Same-PR correction
- Append mandatory fresh provider READY and canonical uncached + immutable release.json SHA checks to original `.agents/skills/portal-living-interface/SKILL.md`.
- Add **only** the exact Portal skill path to `.github/workflows/portal-v2-production-dom-readback.yml` main-push trigger, preserving one existing workflow, approval, ancestry, source-only fences and Chromium/postcheck.
- Add source contract test `tests/brain-portal-current-netlify-sha-preflight-20261105.test.mjs`, plus this append-only ledger, related ONE BRAIN learning JSON and human-readable change log, in the SAME protected candidate lineage.

## Real first Required run and reason for repair
GitHub Required run `41992467024`, hygiene job `127127685482`, failed with `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,brain_learning,human_documentation`. The Required aggregate `test` then failed because hygiene was red; specialist lanes were skipped, **not** passed. This ledger and same-lineage learning/documentation satisfy original Required admission inputs; do not disable or weaken the gate. CodeQL status and new HEAD checks must be independently reread.

## Acceptance and learning boundary
No production or natural owner result is claimed for this candidate. Pass criteria: exact new protected HEAD Required, CodeQL, BRAIN; protected merge; current actual published Netlify SHA and canonical + immutable release identity; original Chromium DOM/mobile/visual success plus postcheck; original owner ONE BRAIN provider receipt. Different source/production commits and unverified human outcomes remain EVIDENCE_DUE. No second executor, writer, scheduler, authorization bypass, broadened source-only allowlist, invented provider ID or retroactive green status.
