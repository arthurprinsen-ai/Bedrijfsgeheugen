# 2026-11-03 — Original business news OpenAI-only provider fix

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Independent diagnosis
Original Supabase native `bg-bedrijfsnieuws` v11 source SHA256 `f97da1520e55a955ae6d486e795704c20338feedce5c49c8740ee7ee40` still calls Anthropic, reads `ANTHROPIC_API_KEY` and enforces provider Anthropic. It intentionally uses the same canonical `supabase-bg-kansenradar-v1` use case whose owner-approved ACTIVE registry provider was migrated to OpenAI/gpt-5-mini. The original provider guard must now fail closed; this is static source proof, not a claimed observed production request result. Rollback of governance is forbidden because owner instructed ALL AI inference via OpenAI.

## Original owner contained remediation
Switch exactly the original Edge provider predicate and vault key to OpenAI while preserving Tavily for non-AI news source discovery. Use forced OpenAI function call `oordeel` with the original tool schema, parse `message.tool_calls[].function.arguments`, refuse missing/invalid/scoped output. Keep strict company name disambiguation, source date and quality, privacy, DMs status suggested, anti-fabricated facts, deduplication, daily original scheduler, original `bg_bewijs` RED proof. No external contact publication or new runtime. Existing `tests/brain-bedrijfsnieuws-20261029.test.mjs` now rejects Anthropic and validates original schema/never-send.

## Terminal evidence requirements
Protected exact-head Required, BRAIN, CodeQL, System Map / lease, merge, original Supabase Edge provider get readback and bounded real source execution. A 200 or zero news must not be described as generated leads; carry no evidence until actual result. Original source owner must ensure outcome and recurrence in ONE BRAIN and portal. This is one workflow in the broader migration; remaining direct Anthropic callers still require specific original owner corrections.
