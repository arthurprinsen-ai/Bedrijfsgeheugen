# 2026-11-13 — native Supabase migration 841 source-lock reconciliation

Fingerprint: `supabase|migration-history|provider-841-original-content-handoff-revision-receipt|20261113-v1`. Original owner: Supabase GitHub protected migration/source lock + original #4198 content-handoff owner, existing P0 #4215 ONE BRAIN. No parallel executor, writer, scheduler, publication or database.

## Directly observed provider truth
- The protected #5714 content source-revision/tenant consumer-ACK change is merged on `main` as `462eca7c5a36565a449f1a28a1a344245ad4dd60`.
- Original Supabase production `adhjwmvyoixzjtmiroln`: 841 rows, 841 distinct versions, terminal `20261113071500 / original_content_handoff_source_revision_receipt_v1`; observed 2026-11-13T07:48:39.110128Z. Original executable SQL exists on `main`.
- Original `supabase/migration-history.lock.json` still had 840 rows, terminal `20261113062500 / original_no_publish_terminal_handoff_ack_v1` (actual prior provider readback). Original postmerge [BRAIN #43386229725](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43386229725) failed 14 checks centered on provider/source-lock drift. Do not suppress or mark as passed.

## Same original protected correction
Append precisely one applied version/name to original source lock, keep all previous 840 rows in exact order and identity, timestamp the real independent observation, and log this same failure/prevention to ONE BRAIN + append-only development ledger. No new SQL, RLS grant, cron, agent, queue, content producer or manually applied migration.

## Closure proof
Canonical Required/BRAIN/CodeQL gates on this exact source-only head, protected auto-merge, read `main` lock as 841 and production provider 841; independently inspect the original next postmerge BRAIN and terminal-closure run. If another unrelated protected migration applies first, reconcile through the existing original lock owner rather than falsely passing source parity. Full Portal → ONE BRAIN → Powerhouse/Heartbeat → provider action → measured CRO outcome → learning remains EVIDENCE_DUE until real source/provider/consumer receipts agree. Original 9 GREEN/6 RED status remains source truth until measured change.
