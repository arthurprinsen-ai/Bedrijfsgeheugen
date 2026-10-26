# 2026-10-20 — Commercial P0 #4198 queue pressure
- Verified function definition shows full join-before-LIMIT in CRM authority review.
- Production logs record contact authority review 30s statement timeouts, heartbeat failures, Cron jobs 116/138/171 startup timeouts. Bounded canonical identity Cron still ACTIVE.
- Source change: versioned SQL queue-preselect index, SKIP LOCKED and conditional fail-closed migration. Same original SQL CRM authority and suppression rules preserved.
- No external posts/emails/DMs triggered in tests. Complete proof requires successful runtime batches and provider receipts after protected merge.
