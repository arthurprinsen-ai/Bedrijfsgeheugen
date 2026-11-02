# P0 — buyer-first editorial contract after protected merge (2026-11-02)

**Original incident:** `powerhouse|content|editorial-specialists-not-unified-with-evidence-application|20261102-v1`
**Parent release:** protected PR #5251, merge `d2ca14e8bfbd5680fed38c62f9242b214d87a9f2`.
**Source owners:** existing `powerhouse-content-orchestrator`, social CRO skill, ONE BRAIN/Heartbeat, native publisher/CMS. No new scheduler/writer.

## Independent failure evidence
The canonical original full BRAIN verification-only run [#41414751648](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41414751648) against the exact original editorial candidate `77b552fe7fa392a76cc376731523596f1f6c4410` completed **5,342 pass, 27 fail, 2 skipped / 5,371 total**. Existing original `tests/brain-brand-learning-editorial-tdz-v1.test.mjs` specifically failed `original buyer-first editorial policy must be preserved`: the source used a separately concatenated `buyerFirstGuide` rather than the original explicit `editorialSystem += ' VERPLICHTE BUYER-FIRST REDACTIE` assertion. The buyer-first text itself still existed; the incompatible binding was a real source/test contract failure, not evidence of a customer publishing improvement. The other 26 original failures remain independent open obligations.

## Bounded original source fix and prevention
Only in the original `powerhouse-content-orchestrator`, preserve the proven `verifiedBrandLearningGuide` declaration BEFORE the mutable `let editorialSystem = (pending.channel...`. Append the authentic existing buyer-first rule **once**, and only to personal/company LinkedIn, using the exact original `editorialSystem += ' VERPLICHTE BUYER-FIRST REDACTIE` source contract; then append the evidence-led council instruction to that same variable BEFORE `stage = 'artifact-ai'`. Keep **both** original OpenAI first and bounded retry call sites passing `editorialSystem` unchanged, as demanded by independent personal editorial and incomplete-output tests. No prompt or source-quality bypass, new writer, media exception, OAuth override, altered frequency or unauthorized newsletter.

Change the NEW council test to assert the explicit original append form and preserved two call sites, instead of merely asserting the removed derived guide. The existing independent TDZ test is unmodified; it must still PASS. Do not weaken original full backend suite or change protected branch rules to promote this small fix.

## Truth and closeout gates
Require original Required + CodeQL on exact new head, original complete BRAIN success, protected squash, actual original Supabase Git Integration production source byte-parity, first new original post/provider/CMS readback, first measured learning-to-application proof and later recurrence check. The root incident remains VALIDATED, proven_fix NULL and the portal must show non-green source evidence until then; producer source being live is not proof of paid orders. Other 26 backend failures remain with their original source owners/issue #4439.
