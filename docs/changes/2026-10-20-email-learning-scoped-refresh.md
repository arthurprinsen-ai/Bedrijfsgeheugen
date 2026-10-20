# Email learning refresh preserves source and foreign-owner data

Production reply-loop request 8678 failed with HTTP 503 at 2026-10-20 16:23:44 UTC. The provider log says `LEARNING_REFRESH:DELETE requires a WHERE clause`. The original refresh clears all statistics before inserting email aggregates, so it also removes unrelated owners.

The existing SQL refresh now serializes its own executions, upserts the original 180-day aggregate query, and removes only missing keys whose channel is email and evidence contract is `powerhouse-email-reply-learning-v1`. Source actions, replies and outcomes and other owners are preserved. The migration rejects an unexpected baseline and verifies invoker execution and unchanged private caller grants. No scheduler, sending authorization or safe-update control changes.

Validation uses actual PostgreSQL semantics: baseline fails foreign-owner preservation; candidate passes aggregation, repeated refresh, expiration and source-retention checks. The committed SQL fixture uses temporary table/function clones and rolls back, so it never invents production messages or outcomes. Provider-native preview and exact-head Required/CodeQL must pass before protected merge. Acceptance requires production function/ACL readback and a successful existing reply-loop execution.

This repairs statistics processing. It does not prove messages sent, recipient approval, orders, forecast outcomes or Instagram media. [Incident #4478](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4478).
