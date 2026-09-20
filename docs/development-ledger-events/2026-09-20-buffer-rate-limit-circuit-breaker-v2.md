# Buffer rate-limit circuit breaker v2
- Obligation: `buffer-rate-limit-circuit-breaker-v2`
- Supersedes: PR #2423
- Root cause: a 429 after Buffer create but before readback could lose durable provider identity and permit duplicate retry side effects.
- Fix: persist provider post id before readback; record Retry-After cooldown; defer Buffer-backed LinkedIn work while cooldown is active.
- Instagram remains on the current Mira/Composio authority and is not blocked by Buffer cooldown.
- Terminal state requires exact-head gates, protected merge, production function readback and provider/runtime verification.
