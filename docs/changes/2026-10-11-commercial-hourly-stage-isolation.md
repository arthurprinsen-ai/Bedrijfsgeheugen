# Commercial job #116 — bounded, isolated hourly stages

The canonical commercial-learning pg_cron job #116 historically attempted contact source refresh and all commercial tasks inside one SQL statement. Repeated 120-second statement timeouts prevented the later outbound and learning stages from receiving their own fair chance to run.

This change **reuses the same job and the same existing fourteen function implementations**. On UTC minutes 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42 one existing stage is invoked in its own transaction, each exactly once per hour. The source review/refresh stays with existing contact job #138. A stage failure yields a failed pg_cron run without preventing subsequent scheduled stages. There are no new provider senders, CRMs, or override of authorization/quality/contact-pressure gates.

One internal stage receipt per stage and UTC hour enters canonical runtime events. Its contract explicitly forbids claiming a sent message or revenue from an internal function completion. The separate provider receipts and delivery readback remain authoritative.

## Evidence and release
The initial evidence is six or more job #116 statement timeouts on 2026-10-11. The portfolio view count plan ran in around three seconds, so the full-transaction duration is the likely contributing issue, not a proven individual view timeout. Execute protected Required/backend, CodeQL and Supabase Preview for this migration. Only after protected merge and source/readback of production cron 116, verify multiple separate successful stage runs, one isolated failure without starving later stages, and real authorized outbound evidence. Full commercial P0 #4198 remains open until provider delivery/conversion/learning are independently proven.
