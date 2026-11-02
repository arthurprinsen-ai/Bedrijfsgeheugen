# Original LinkedIn company: stop repeating one story before generation

Date: 2026-11-02. Original incident: `powerhouse|publication-recovery|linkedin_company|distinct_verified_story_required|v1`. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439.

## Independent source proof

Original `content_publication_obligations` 2 Nov 08:09:25 UTC: company status BLOCKED, error PRE_PUBLISH_GATE_BLOCKED, original review 422 COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT, external_id NULL. The exact emitted concept concerned lost or unfollowed offers, which had already appeared in the company's editorial family. The existing server reviewer CORRECTLY rejects it. The model can select the same idea again before the hard gate, wasting an editorial cycle.

## Scope and authority

The existing `_shared/editorial-council-context.mjs` now instructs the ORIGINAL generator to seek a dated, independently checked *different* business problem before generating company text. Without verified new evidence it must HOLD and research rather than paraphrase an old offer case or invent a testimonial. The existing publisher and `company-linkedin-editorial-contract.mjs` remain unchanged; this is advisory prevention, NOT a selector rewrite or guaranteed automatic publishing. Existing ONE BRAIN lessons, SkillOps and the original publisher alone are authoritative. No second scheduler/writer, company OAuth change, extra sends, fake source, weakened security or fabricated outcome.

## Acceptance and remaining independent work

Regression: `tests/brain-company-pre-generation-source-novelty-20261102.test.mjs`, plus the original company contract suite. Machine observation lives in `brain/learning/2026-11-02-company-pre-generation-novelty-v1.json` and the original Supabase registry. The next *natural* original orchestrator pass must demonstrate a real novel source, passing reviewer/duplicate gates, original provider ID, independently verified readback, and subsequent learning. Protected Required, CodeQL, original full BRAIN, merge, original Supabase Edge source parity and Portal source projection must occur before any LIVE code claim; code checks alone do NOT prove a company post, lead, conversion or paid order.
