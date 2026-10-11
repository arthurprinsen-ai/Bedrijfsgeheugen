# Development ledger — daily connection intelligence, 2026-10-11

- Parent P0 #4198; canonical existing Brain / Powerhouse / Heartbeat and Supabase runtime remain sole authorities.
- Input truth: 23,295 canonical connections, zero newly assessed at initial check; separate sales-loop cron #116 timed out repeatedly; no valid claim that all profiles were deep-enriched by external providers.
- Existing code reused: cron #138 identity graph, incremental contact refresh function, full refresh function, signal/engagement/news sources, canonical commercial Heartbeat/NBA. No duplicate sending queue or scheduler.
- Runtime restoration: bounded 500-contact assessments on the existing cron's ten-minute cadence. Original identity graph frequency preserved hourly; source-based triage never authorizes DM/email.
- Production tests: manually verified successful 50- and 500-contact batches. Automatic scheduled run 2026-10-11T11:22Z succeeded in 50 seconds and advanced daily coverage; data and decision readback originally 4,050/4,050 following manual reconciliation. Updated source_snapshot write-through in existing refresh functions to prevent later legitimate refreshes from erasing decisions; a subsequent 100-contact refresh returned successful write-through evidence.
- External news: existing company-news cron #20 extended to seven days; one Sunday run researched 15 companies, 58 to 63 news rows, zero recorded provider-sent DM.
- Security: existing RLS/auth/provider/communication/suppression gates unchanged. All source data remains in canonical tables. No sensitive traits inferred and no direct automated mass outreach.
- Source parity and protected merge: PR #4337 includes SQL, automated test, canonical learning, human change document and immutable ledger. Do not mark PR merged or P0 closed until all required CI and actual end-to-end proofs succeed.
- Remaining debts: full-day coverage incl source freshening, independent subsequent scheduled decision readback, job #116 timeout, provider delivery, commercial outcomes and measured learnings.
