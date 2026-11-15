# 15 november 2026 — first-party source failures: diagnose instead of unbounded failed 4-hour fetches

Parent original P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Native observations
The existing native Supabase Edge `powerhouse-relationship-public-research` v101 was ACTIVE. Its original first-party graph holds 187 eligible company domains with 8 daily rotation slots. The native latest source audit at 18:07 UTC recorded two same-lineage overdue first-party retries, both `SOURCE_HTML_UNAVAILABLE`; ten original research actions still have checked=false and no candidate, eight were due. Some original source actions had already reached five fetch attempts. 23,295 contacts remain context-refreshed and 605 have preexisting canonical emails; no new candidate or provider send is inferred.

## Root issue and bounded fix
Current source worker persists only `SOURCE_HTML_UNAVAILABLE` and retries every four hours regardless of failure age, hiding whether upstream HTTP, network/TLS, cross-host redirect, content type, body or size caused the failure. Preserve original 2.5s per URL, 160kB body, HTTPS and same-host redirects, source identity and provider-messaging gate. Record bounded **non-PII** reason codes per same original action; use deterministic 4h for attempts 1–2, 12h for 3–4, 24h for 5–7 and 48h for 8+. Never disable the original #116 runtime; the free original rotation continues probing other eligible company domains. At 5+ source failures explicitly assign the existing owner alternative-lawful-first-party-source search or the next safe retry rather than fabricating a source.

## Strict acceptance
The source code/test/skill update alone is not proof a named person email was discovered, that #138 processed a candidate or that a provider sent a message. Required/CodeQL, protected merge, native Edge production source/readback, next original due-run diagnostics and actual independent consumer ACK/outcome must all be checked separately. Original commercial four broken handoffs and source debt remain OPEN until independently disproven by actual source/provider proofs. At most one original writer, no parallel scheduler/sender or false green.
