# 2026-11-03 — Owner decision: OpenAI-only across original Powerhouse AI inference

Canonical issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Permanent target and exclusions
User explicitly instructed “Alles moet via OpenAI gaan”. Interpret as all **AI model inference** in Bedrijfsgeheugen, Powerhouse and portal must use the OpenAI API. Preserve GitHub, Supabase, Netlify, Notion, Tavily, DataForSEO and social connectors as their original non-model infrastructure/data providers. Do not invent an OpenAI equivalent for unrelated services. Do not reactivate historic Make agents or disabled Composio/Groq fallbacks. Never spend money or bypass a provider permission on an unapproved use case.

## Actual source inventory, not a green claim
Five LIVE canonical `brain_ai_governance_registry` use cases still declare Anthropic: `netlify-document-extractor`, `netlify-koppelingen-ai`, `netlify-vraagbalk`, `supabase-bg-experimentcyclus-v1` and `supabase-bg-kansenradar-v1`. In addition several original source modules directly reference Anthropic endpoints/keys: business news/profile, opdrachtenradar, commercial composer, LinkedIn sales machine, website Brain AI adapter, connector AI and outdated regulatory script. The historical suspended 16 Make agents and 3 legacy Composio/Groq fallback records must remain suspended. A single registry rename cannot migrate live code.

## First original code lane — Kansenradar
Original `supabase/functions/bg-kansenradar/index.ts` now routes both news evaluation and DM draft generation through the OpenAI Chat Completions JSON object response with model taken from canonical approved use-case and `OPENAI_API_KEY`. It validates the mandatory object/array fields, retains existing business-source checks, DM drafts, no fabricated interactions, privacy, refusal handling, `bg_bewijs` RED/GREEN and original daily cron. It removes the Anthropic-specific credits receipt check which would incorrectly suppress OpenAI calls. Original continuity skill and regression updated, no new writer.

## Release + governance handover
Do **not** switch live registry to OpenAI while the original Edge function still expects Anthropic. Require protected PR + exact source. Then, in a bounded original-owner change, update only canonical `supabase-bg-kansenradar-v1`: provider `OpenAI`, model_id `gpt-5-mini`, model_revision, approval evidence `OWNER_DIRECTIVE_20261103_ALL_AI_INFERENCE_VIA_OPENAI`, `inference_platform=OpenAI API`, subprocessor OpenAI and corresponding data-transfer review; preserve data categories, use-case purpose, human oversight and owner. Must revalidate current OpenAI agreement/transfer context before claiming formal compliance. Then deploy matched source, verify Supabase v+hash and next natural AI result, never report GREEN from metadata alone. Record original owner and rollback-safe handover.

## Next original functional owners
Track migration as separate, scoped protected PRs sharing the same ONE BRAIN obligation and exclusive writer. Website chat / document extractor / connector AI / experiment cycle and other direct callers cannot be marked converted until exact provider+behavior and tenant gates pass. No alternate provider is silently approved, and no removal of historical proof.
