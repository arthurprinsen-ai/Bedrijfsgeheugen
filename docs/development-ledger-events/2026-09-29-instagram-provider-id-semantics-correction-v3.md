# 2026-09-29 — Instagram provider ID semantics correction v3

Correction to the existing `instagram-canonical-provider-identity-v3` lineage.

Live provider readback showed that Composio returns two distinct identifiers for the canonical `bedrijfsgeheugen.nl` BUSINESS connection: node `id=28537384955950341` and Instagram Graph `user_id=17841446582493753`.

The publisher, config, Brain learning, skill, AGENTS/chat inheritance and System Map now preserve that distinction. Live provider side effect remains media `18105956765257858`; `republish_forbidden=true`.
