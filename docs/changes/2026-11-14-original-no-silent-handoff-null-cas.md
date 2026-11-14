# Geen stille uitval in oorspronkelijke Powerhouse → BRAIN → Heartbeat-overdracht (14 november 2026)

Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
Scope: EXISTING `powerhouse-content-loop` and original pure recovery planner only. One publisher, one cron lineage, original ONE BRAIN failure register. Existing agent and skill contracts updated. No migration, new queue, direct provider send, second scheduler or bypass.

## Production facts, not a green claim

- Original `powerhouse_loop_assurance_state_v1`: 15 tracked processes, 7 RED + 1 AMBER, remaining 7 GREEN. Existing cron #120 Mira, #140 Content/Heartbeat, #171 runtime mux are active. A running scheduler alone proves neither successful handoff nor business outcome.
- Original Instagram 14 Nov: `content_publication_obligations` PLANNED, external_id/canonical_url null, ONE BRAIN `CONTENT_HANDOFF` OPEN / OVERDUE_PUBLICATION, and original Heartbeat receipt `MIRA_SOURCE_SELECTION_TO_LINEAGE_MISSING`. Actual last Meta post was 3 Oct; no 14 Nov post.
- The existing recovery planner had numerous implicit `continue` branches with no reconciliation record for missing, duplicate, advanced, malformed or unauthorised obligations. The original direct-SQL adapter compare-and-swap used `.eq('next_action',null)` and `.eq('external_id',null)` which was already translated to SQL IS NULL; explicit `.is(...,null)` is now implemented in the same adapter to make the original null predicate verifiable, not to claim a proven SQL NULL bug.
- When CAS matched zero rows, conflict was incremented but the current canonical receiver row was never independently read to distinguish already-accepted handoff from a newer protected/provider state.

## Original owner implementation

The existing pure `planOriginalPublicationHandoffs` now returns typed `updates`, `alreadyIdentical`, `unresolved` and `routedToOriginalOwner`, always linked to original channel and owner. These do not make a new obligation store or authorize email. The existing `powerhouse-content-loop` writes a next_action to the same original tenant/date/channel row only when statuses are PLANNED/BLOCKED/FAILED and external_id IS NULL. For missing previous action it uses `is('next_action',null)`, otherwise `eq('next_action',previous)`. All 0-row CAS results receive a read-only current-row check, preserving concurrent provider IDs and protected release progress.

Unresolved receiver handoffs are typed and written through the existing `brain_observe_failure` owner with stable day/channel/reason occurrence key, and included in the existing `brain_records` result and original content-loop recovery step. Original #171/Heartbeat consumers retain the same source revision. No new writer, scheduler, unconditional retry, OpenArt credit bypass or unsafe email send. A hard authorisation/face/media gate can prevent an external effect without removing the original obligation or disabling its executor. Failure remains OPEN with owner/next safe action.

## Acceptance

1. Protected Required, CodeQL, source assurance and backend regression, preserve old recovery test and new no-drop matrix.
2. Main merge and independent original Supabase Edge full source parity.
3. Same original natural #140 content-loop and #171 Brain / Heartbeat readbacks show that missing, NULL, duplicated, advanced, protected or already-received handoffs are independently classified and persisted.
4. Only exact Meta/LinkedIn/Gmail/public blog readback with source-revision and named ONE BRAIN consumer PROCESSED ACK plus Heartbeat outcome closes work; old backlog may remain OPEN until actual authorized provider and verified source conditions are satisfied.
5. Never claim every loop green or daily Instagram fixed from these code tests alone.
