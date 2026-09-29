# 2026-09-29 — Instagram provider ID drift v3

Production incident: canonical Mira Reel was publication-ready, but Instagram provider identity preflight returned HTTP 400.

Evidence: active canonical Composio account `bedrijfsgeheugen-nl-canonical` read back `bedrijfsgeheugen.nl`, BUSINESS, provider user ID `28537384955950341`.

Change: remove historical hardcoded provider user ID from the publisher; discover live providerUserId via `INSTAGRAM_GET_USER_INFO(me)`; bind create/publish/readback to the same verified ID.

Contracts updated: publisher, tests, Instagram skill, AGENTS, chat-learning contract, Brain learning, System Map.
