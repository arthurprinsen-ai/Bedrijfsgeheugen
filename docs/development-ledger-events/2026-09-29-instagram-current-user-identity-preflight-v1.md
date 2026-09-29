# 2026-09-29 — Instagram current-user identity preflight v1

Incident: canonical Mira Reel passed media gates but canonical Composio Instagram identity preflight returned 400 before provider write.

Root cause: direct legacy Graph-id lookup plus collapsed `id/user_id` semantics.

Fix: authenticated-current-user lookup (`me`), separate node-id and Graph user-id validation, canonical username + BUSINESS gate, same-account publish/readback.

Runtime closure: provider media `18105956765257858` is published and read back on `bedrijfsgeheugen.nl`; Powerhouse state is `published/PUBLISHED/LIVE_PROVEN`.
