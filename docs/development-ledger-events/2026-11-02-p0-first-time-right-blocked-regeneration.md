# Append-only development ledger — 2026-11-02 First Time Right

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232 and https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439.
- Original fingerprint: `powerhouse|publication-recovery|linkedin_company|distinct_verified_story_required|v1`.
- New cause fingerprint: `powerhouse|publication|blocked-editorial-no-automatic-source-rotation|20261102-v1`.
- Source fact: original company content `BLOCKED`, prepublish 422 `COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT`, `external_id=NULL`, selected repeat-prone cross-channel recommendation `d05ce26c-9982-426a-8101-e2e3cb6cf390`; today's blog GENERATED without CMS approval, Instagram BLOCKED media job WAITING_ASSET.
- Root: original content-loop bootstrap handles pre-provider GLOBAL_POST_DUPLICATE_BLOCKED but not exact semantic company 422, and original orchestrator `shouldPreserveExisting` freezes that blocked result. Model prompt changes alone do not activate same-owner recovery.
- Solution: new pure bounded eligible-source gate, existing content-loop bootstrap and orchestrator original re-decision, exclude already rejected IDs, same original provider/quality gates, new deterministic tests and original skill handoff.
- Failure categories: editor 422 → new distinct source only; final Mira media → original media producer and threshold; blog GENERATED → original editor/approval/protected release; capability/OAuth/financial permissions → do not bypass; possible provider side effect → no blind retry.
- Invariants: no new scheduler, no second executor, no duplicate dispatch, no self-approval, no protected merge bypass, no falsified incident success. Source PR is an implementation candidate; provider IDs and readbacks still owed.
- Regression: `tests/brain-first-time-right-company-regeneration-20261102.test.mjs`; original learning regression `tests/brain-original-incident-learning-20261101.test.mjs`; full BRAIN and Required+CodeQL.
- Outcome pending at source authoring: branch-only, not live. Preserve original incident as ACTIVE/CRITICAL until actual end-to-end published URL/URN/Meta and later natural no-repeat check.
