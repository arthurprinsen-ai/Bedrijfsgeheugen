# 2026-11-10 — Original Powerhouse portal handoff evidence/ACK regression

Owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Fingerprint: `portal|powerhouse-runtime-bridge|unacked-event-deleted-and-cross-principal-retry|20261110-v1`.

- Root cause: original debounced queue deleted before Brain POST; failed or unverified POST could be swallowed; no guaranteed same-principal retry gate on the immutable queued action.
- Containment: original runtime bridge and existing interval/focus/auth hooks only; exact Brain `id` plus `correlationId` ACK; stable idempotency; one active in-flight send per key; old tenant queue/lineage cleared on identity change.
- Safe fallback: anonymous and demo never POST; no parallel scheduler, no added DB/migration/outbox or altered Brain authority. The original store-restart durability requirement remains EVIDENCE_DUE.
- Evidence: original runtime bridge test plus `tests/brain-portal-bridge-handoff-ack-retry-20261110.test.mjs`; future protected CI/readback must distinguish source test from actual live tenant and independent outcomes.
