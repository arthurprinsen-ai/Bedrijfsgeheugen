# P0 #4198 — finite Anthropic predictive tool-use deadline recovery

Date: 2026-10-09. Exactly version 182 of the existing Supabase `powerhouse-predictive-engine` Edge function was deployed and independently compared byte-for-byte with merged protected GitHub main PR #4274. The first real authorized full-engine request (pg_net 1707) returned HTTP 500 `Signal timed out.` and the same exact error was persisted in `bg_gezondheid` at 15:25:00 UTC. The prior PostgreSQL SQLSTATE 57014 statement timeout did not recur in that observed run.

Source inspection identifies the only explicit `AbortSignal.timeout(45000)` around Anthropic `messages` `forecast_plan` tool use. A genuine minimal Anthropic provider test had returned 200, but the evidence-heavy prediction exceeds the 45-second inference budget. This patch changes **only** the finite provider request deadline to 90 seconds; existing authorized 120-second outer transport, governance, strict evidence validation, persisted forecasts and five-row signal write batching remain unchanged. No model routing, scheduler, secondary executor or external publication modifications.

Acceptance: protected Required/CodeQL/preview, source parity to v183, one real authorized forecast completing with provider+forecast+Brain evidence. A successful model call alone cannot close overall omnichannel P0 #4198.
