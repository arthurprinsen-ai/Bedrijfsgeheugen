# Anthropic-only predictive provider — P0 #4198

Date: 2026-10-09. Existing-state-first: `claude-sonnet-5` is already the approved primary Anthropic model. The predictive Composio/Groq fallback was suspended in production AI governance after verified provider billing restrictions. This patch removes the direct Groq dispatcher from the predictive Edge function, without introducing another scheduler, executor, agent or source of truth.

The Anthropic key is configured, but not proof of model execution. The independent existing scheduler invocation (pg_net request 1684) returned HTTP 500: `canceling statement due to statement timeout`. Treat this as a real production failure, not successful inference. Forecast evidence-key validation, idempotent forecast upsert, provider attribution and safe failure remain intact. The dormant shared fallback module is left unchanged for historical tests and other uses; no unrequested global changes.

Acceptance before P0 closure: required checks, protected merge, exact GitHub/Edge parity, successful Anthropic API run and readback, externally measured sales outcome with exact delivery ID, and one-Brain attribution. Do not manufacture outcome receipts.
