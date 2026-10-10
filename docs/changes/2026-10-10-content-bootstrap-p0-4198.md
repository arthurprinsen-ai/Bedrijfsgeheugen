# Content loop bootstrap: daily channel decisions — P0 #4198

## Verified production gap
At 08:49 local on 10 October, the content-loop supervisor had no channel decisions, while the four required daily obligations remained PLANNED/BLOCKED. The supervisor checked for pending `decided` rows *before* invoking its orchestrator. Therefore it never called the authority that creates those decisions. Scheduler OK was not commercial delivery.

## Existing-state-first correction
The existing `powerhouse-content-loop` supervisor, with its one lease and canonical scheduler, must seed missing operational channel decisions via the existing `powerhouse-content-orchestrator` **before** attempting bounded artifact generation, publishing and blog delivery. Do not create parallel executor, schedule, Brain or campaign. A timed-out child is not retried in the same tick.

## Channel gate separation
LinkedIn personal: verified founder identity and source truth, prepublish check and uniqueness. LinkedIn company: organization OAuth scope and organization author, separate source-backed problem. Instagram: daily selected winner + matching exact Mira media proof and Meta readback. Blog: canonical slug and site production proof. Commercial emails/DMs are separately authorized and must never be inferred from social execution.

## Closure and proof
Protected tests, CodeQL, source-contract and Supabase Preview are required before merge. Then deploy exact protected main source, verify active Edge SHA and trigger the canonical content loop once. Only real, distinct provider IDs and independent readback count as live; outcome metrics and Brain learning remain separately pending.

- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4299
- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
