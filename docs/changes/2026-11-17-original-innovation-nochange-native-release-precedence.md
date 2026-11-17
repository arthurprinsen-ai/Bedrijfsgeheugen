# One original innovation: no-change is not no-previous-implementation

Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Genuine postrelease false-negative

The protected existing continuity correction https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5983 merged 2026-11-17T20:39:02Z. Manual existing workflow `original_delivery_recovery` run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44171758002 completed successfully; native production SQL independently read back 14/14 original innovation receipts and 14 OPEN obligations. But source-bound original candidate `55bb0754-355b-4940-aaea-aed7123e7e57` incorrectly remained in `NO_CHANGE_INDEPENDENT_OWNER_REVIEW_DUE`. The original intake holds a **newer no-change receipt** from the Codex engineering step (2026-11-17 20:30 UTC) AND a genuinely older independent protected PR #5857 source implementation; earlier `examineOriginalDelivery` would exclude the latter when `noop` was present.

The no-change review means **no new source diff in the latest Codex attempt**, NOT “no source implementation exists.” Both receipts belong to the same original candidate and source revision, and must be reconciled instead of letting the latest review override the real historical protected work.

## Additive, secure correction

Remove the inappropriate `!noop` veto from the one existing source-specific historical provider readback condition. Keep unchanged the earlier strict exact NO_CHANGE identity/hash/revision verification; maintain original protected source owner/revision/PR-native merge proof, seven-day PostgREST source/action full-coverage census, same original versioned CAS and independent GET. Never permit an empty newer code diff to erase prior native proof. Add regression for 1) exact-source nochange plus genuine older native merge plus fresh full provider source census; 2) forged nochange with wrong hash still failing closed.

Both old and new source are **nonterminal** without externally independently measured business value, customer effect/holdout, provider send, native current Netlify GET or Heartbeat learning. Original 14 obligations remain OPEN; no new cron, producer, table, publisher, cost, model spend or parallel agent.

## Release truth
Protected Required/CodeQL on exact head, protected merge, then one `original_delivery_recovery` scoped run of the **same existing workflow**, provider REST and original Brain independent readback. Keep source and nochange evidence immutable. Rollback via protected revert only.
