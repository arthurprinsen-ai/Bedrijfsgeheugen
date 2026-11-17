# Original no-change receipt must not hide a historically protected innovation

**Original incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Independent 17 November production failure

- Original 55bb0754-355b-4940-aaea-aed7123e7e57 / original operation edebcb32-335b-49f0-b527-eb4289f95c5c is the previously protected source-joined sales-execution read-model innovation.
- Original native GitHub PR #5857 was MERGED into protected main, followed by immutable source corrections #5866 and #5879; the original operation already preserved historical protected implementation evidence and internal original SQL source counts.
- Parent PR #5109 was a separate earlier SQL guard and PR #5981 correctly enabled a safe historical-parent code selection. The model made **no new source diff**, and the ORIGINAL Brain legitimately registered `original_code_nochange_review` at 20:30:48Z.
- The earlier protected continuity fix https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5983 had an overlooked `!noop` conditional that caused the already-protected implementation and current seven-day source measurement to be skipped. The production original Brain readback at 20:40:34Z continued to show `NO_CHANGE_INDEPENDENT_OWNER_REVIEW_DUE`, `internal_source_readback=null`, despite original workflow run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44171758002 succeeding and all 14 original obligations being preserved.

## Exact same-lineage correction

The ORIGINAL `scripts/brain/innovation-original-delivery-continuity.mjs` already validates every nochange receipt's source candidate/revision/hash and that no PR or implementation/consumer effect is being claimed. When it also finds the original exact owner/revision protected source evidence, the source evidence must receive its **independent GitHub MERGED historical PR readback and current original Supabase PostgREST full-seven-day source-action audit** even when no new Codex work was produced. This change removes only the redundant `!noop` veto. The immutable nochange receipt remains intact, and original status/obligation remains nonterminal until independent consumer and Heartbeat outcome/holdout truth.

The original Codex selector remains independently guarded by the source-specific implementation evidence and cannot repeat the already protected code. There is no second source table, agent, scheduler, production SQL mutation, outbound provider call or fabricated completed innovation.

## Acceptance and rollback

- Replay the production nochange receipt in `tests/brain-innovation-existing-protected-source-reconcile-20261117.test.mjs`; verify the original native merged source and current source measurements can progress to `PREEXISTING_SOURCE_CURRENTLY_MEASURED_CAUSAL_OUTCOME_DUE`, while an invalid nochange record fails closed.
- Protected Required/CodeQL/Netlify/website gate and native main merge.
- Run existing targeted original delivery recovery, independently confirm 14/14 original Brain receipts and this candidate's latest source count, and preserve `consumer_ack_verified=false`, `actual_impact=null`, `independent_heartbeat_learning_verified=false` until measurable business results.
- Roll back only this code gate via protected revert, preserving original historical nochange and source evidence.
