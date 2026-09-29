# 2026-09-29 — Instagram runtime identity authority v4

Latent production regression found after successful Mira Reel publication: the deployed publisher still referenced deleted symbol `INSTAGRAM_CANONICAL_USER_ID`.

Fix: remove all executable references to the deleted authority; resolve provider node id and Graph user_id live; require canonical username + BUSINESS/CREATOR; bind create/publish/readback to live user_id; add regression coverage and project to skill/AGENTS/chat/System Map.

No republish occurred. Existing provider media ID remains immutable and `republish_forbidden=true`.
