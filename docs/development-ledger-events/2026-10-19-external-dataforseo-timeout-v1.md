# 2026-10-19 — bounded DataForSEO deadline

Source incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Predecessor: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4514
Observed DataForSEO timeouts in v12, even with successful alternative-provider organic responses. The 12s Tavily timeout was inherited by DataForSEO. Preserve the production-ready source, increase **only** the fallback's bounded timeout to 35s, keep existing pg_net transport 120s. No repeated provider retries. Verify actual provider output and never equate a status heartbeat with approved market intelligence.
