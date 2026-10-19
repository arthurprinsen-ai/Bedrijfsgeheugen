# Predictive engine OpenAI recovery
Obligation-ID: predictive-openai-recovery-20261019
Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

The real predictive engine failed with Anthropic credit exhaustion while the user had already requested OpenAI instead. The existing canonical market-forecast engine now uses OpenAI Responses with the same bounded four-forecast schema, single forced strict function, finite 90-second deadline and store=false. The scoped migration changes only the existing approved ACTIVE canonical use case to gpt-5-mini, already used successfully by the existing OpenAI proof route; approval and customer governance stay unchanged. Model selection is a bounded operational choice, not a claim that this is the newest model.

An explicit public-market projection removes internal forecasts, revenue-learning free text, arbitrary nested fields and non-market sources. Embedded e-mail and phone details are redacted. Source references must be in the actual sent context. Existing two/three independent-source counts, probability/confidence floors, five-row ingestion batches and first-mover scoring remain mandatory. Provider errors are status-only in shared health receipts. There is no fallback to Anthropic/Groq and no new scheduler or customer financial activation.

Regression-first tests observed missing implementation and embedded-contact leakage, then 38 predictive checks passed. Historical inactive Groq helper tests are retained as archival contract checks; active transport assertions now name OpenAI. The adaptive classifier includes the new executable regression. Protected Required, CodeQL, native Supabase Preview, production Integration deployment and actual forecast/runtime readback remain required before live success. Real customer acceptance and Instagram quality/moderation are separate unresolved evidence boundaries.

Rollback restores engine and existing use-case provider together through protected main; do not directly deploy an Edge Function or lower evidence thresholds. A provider/model access failure remains explicit and never invents forecasts.

Independent code review caught contact redaction changing digit-heavy SHA evidence keys. A red/green regression now preserves validated opaque IDs exactly; 104 combined predictive, delivery and runtime-scope checks pass. No other important findings.
