# 25 October 2026 — Distinguish concurrent pointer retirement from corruption

Parent P0 #4446, commercial P0 #4198. After PR #4909 protected merge (Netlify READY published 15:50:51 UTC), independent Netlify logs show ~3 minute cron invocations per minute with overlapping processing of fresh indexed events. Each group has 204 successful batches (persisted 3–4) and 503 partial batches (`indexPointerInvalid=3–7`, `indexSourceMissing=0`, `providerFailed=false`). This is consistent with `list()` snapshot pointer entries being deleted by another concurrent invocation before `get()`; no proof every pointer is malformed.

Within existing one-minute growth-drain, a successful null `get(pointer)` is no longer reported as index corruption; a bounded `indexPointerGone` counter records the race. Missing canonical source after a valid pointer, malformed non-null pointer and thrown provider read errors remain true unresolved integrity failures with 503, durable evidence and safe processing of unrelated events. No new cron, worker, contact, event identity, old source deletion, or synthetic results.

Focused deterministic regression covers delete-between-list-and-get while a good event persists, thrown `get` provider error staying red, and a genuine missing source staying red. The protected merge is not equivalent to proof of unique human traffic, CTA conversions or paid orders.

CI admission regression: the initial focused test exposed that the legacy fallback scanned the same `pending/` keys as the indexed lane. The fix explicitly skips disposable pointers in legacy mode; new regression proves one pointer read and one external write. All original event receipts remain untouched.
