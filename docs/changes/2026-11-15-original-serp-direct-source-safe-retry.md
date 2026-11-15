# Original #116 commercial relationship research: reject tracked SERP link and retry without sending

Parent P0: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Existing single executor is `powerhouse-relationship-public-research` under existing cron #116.

## Root cause verified

The existing first-party research/related DataForSEO result for a held original commercial email action was marked `done` based on `https://google.com/goto?...&gsessionid=...`, which is a search engine redirect, not a stable original publisher page. It was recorded in a research runtime event as `data_quality=VERIFIED` even though code never independently confirmed the page. The original consumer correctly held the email with `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`; the source->composer scorecard counted a broken SLA. Independently browsing a publisher-hosted underlying YER AI-training article only supports that YER advertises a course; it does not establish that a particular YER contact intends to buy data/AI services. Do not assert an outreach trigger or email permission.

## Same original worker fix

Change the existing Edge implementation + the existing pure shared attribution helper. Reject `google.com/goto`, `/url`, `/aclk`, known shorteners and non-HTTPS URLs at source-candidate construction and **before** the same already obtained SERP results enter named-mailto/public page ingestion or trigger selection. Treat remaining organic snippets as `UNVERIFIED_SERP_SNIPPET`; direct URL alone is still not personally relevant or sufficient for send permission. Record rejected redirect counts separately in original source health; `waarschuwing` when rejected or existing first-party HTML debt remains. This never grants `provider_send_authorized`.

Before the same Edge polls original due actions, recover a bounded maximum 5 legacy `done` original `relationship-research:outreach-source:%` actions with redirect URLs from the prior seven days. Require exact original linked recipient action (same person/company) in `prepared` or `waiting`, `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`, and the no-message/no-ambiguous-provider gate enforced by existing `researchNoSourceFeedback`. Change only the same research action to `waiting` with 24-hour retry, clear unsafe redirect as `source_url`, preserve its original ID/provenance, and write exact no-source ACK to original held recipient with `SOURCE_REDIRECT_REJECTED_NOT_VERIFIED`. CAS `updated_at` guards protect concurrent agent changes. Later same #116 stage retries naturally, without new cron, queue, sender or extra DataForSEO query now.

## Acceptance

Protected exact-head Required, JS/TypeScript CodeQL and native existing Supabase/Edge production promotion. Independently fetch deployed `powerhouse-relationship-public-research` source/version and observe at least one natural original #116 run returning `wrapped_original_source_recovered.recovered` and source/recipient exact original-action readback with no email sent. On next scheduled research, sources must have real direct publisher link + textual relevance before advancement; if missing, safe retry remains open and separate commercial P0 remains `DEGRADED`. No false green, external send, guessed email, inferred consent or direct SQL bypass.
