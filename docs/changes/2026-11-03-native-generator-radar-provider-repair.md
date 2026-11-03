# 2026-11-03 — Original native generator AI-provider drift and radar credit-denial protection

P0 original issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Source-backed diagnosis

- Production Supabase `bg-native-content-generate` v17 (SHA256 `a19e8204a91556e520e99b02e56d614e10426d2a05d5ef42158fcc69ea094be4`) is still an Anthropic-only legacy Notion concept function. The canonical `public.brain_ai_governance_registry` use case `supabase-bg-native-content-generate-v4` is **already ACTIVE/approved OpenAI `gpt-5-mini`** after the earlier protected migration. The function's early governance gate rejects requests as `AI_USE_CASE_NOT_APPROVED` and 2026-11-03 source proof is RED. The correct repair is not to change approval to Anthropic or pretend it worked; align original Edge source with already approved OpenAI use case. Preserve original Notion candidate/read/write, grounded content and source number-check gates; generated output is a concept, not an approved publication.
- Production `bg-kansenradar` v11 (SHA256 `1969d74681bed4facc81d76579d9e51e5e70a19a0278be51619cdb3f0af38948`) is correctly approved for Anthropic; 2026-11-03 real `brain_delivery_evidence.RED` identifies `AI_400` with insufficient credits. Neither changing `approved` nor quietly using a different provider, spending funds, claiming GREEN or disabling cron is permitted. Preserve operational truth and stop repeated unnecessary API requests while waiting for real provider capacity.

## Protected candidate / bounded effect

- Mirror the actual deployed original native Edge source into Git and convert only the legacy AI call to the already-approved OpenAI Chat Completions strict JSON schema. Preserve `problems` validation before Notion PATCH. Read `OPENAI_API_KEY` from original environment/vault. Never print secrets.
- Mirror the exact existing original radar Edge source and use original `brain_delivery_evidence` to stop repetitive attempts for 20 hours after provider insufficient-credit receipt, returning HTTP 503 `WAITING_AUTHORIZED_BILLING_OR_ORIGINAL_PROVIDER_RECOVERY`, with no duplicate red record, fake approval, new scheduler, retry storm or automatically published material. Original daily cron stays active. This **does not create Anthropic credits** and is deliberately not called an AI-provider recovery.
- Regression `tests/brain-original-native-generator-radar-provider-20261103.test.mjs`, existing ONE BRAIN continuation skill and original incident registry. No new database tables, scheduler, producer, privileged capability or port.

## Release truth

The original Supabase Edge runtime is authoritative: protected main merge **alone does not** deploy these two Supabase functions. The authorized original owner must verify compiled source and provider readback. Deploy exact files through the native Supabase protected route, then `get_edge_function` source readback and natural cron result; successful transport and model contract readback are not proof a content draft or opportunity was generated. The radar can only be fully GREEN after authorized Anthropic billing restored or an explicitly approved, tested replacement use case, then an independent real source-to-outcome execution. Original registry must reflect these distinctions; no cosmetic maturity promotion.
