# 2026-11-10 commercial Gmail provider readback messageId correction

- Source: production original action `c749e43b-a335-49d6-bf01-42383930347f`, provider Gmail id `1a1c4b1f339a051f`; actual Gmail source SENT and recipient match, but original readback returned `GMAIL_READBACK_MISMATCH` with `id_matches=false`, `sent_label=true`, `recipient_matches=true`.
- Independent proof: authenticated native Gmail `read_email(id)` exact id/thread/SENT/recipient and Composio `GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID(format=full)` response `data.messageId` exact id, with SENT and To headers. No duplicate send requested.
- Cause: original Edge readback checked `id/message_id`, not actual Composio `messageId` field. Existing retry correctly prohibited re-sending but failed terminal settlement.
- Original repair in same protected PR: strict shared `verifiedGmailReadback` supports provider shape, verifies exact ID, recipient and SENT; no quality/consent/suppression gate relaxed. Token-protected `readback_only` in existing sender intentionally returns before fresh composer and dispatch. Preserve original idempotent outcome and readback evidence.
- Prevention: three real behavioral tests + actual provider shape fixture in `tests/brain-gmail-messageid-readback-only-20261110.test.mjs`, Brain learning record, original relationship skill.
- Completion: protected Required/CodeQL pass, canonical merge, original deployed Edge verified, readback-only execution with 0 sends, original action and outcome independently read back. Until then no claim of terminal green or proven experiment impact.
