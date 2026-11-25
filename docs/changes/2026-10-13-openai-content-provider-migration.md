# POWERHOUSE content generation — OpenAI migration

The content generator in `supabase/functions/powerhouse-content-orchestrator/index.ts` was hardcoded to Anthropic, and the production attempt failed with a billing error. PR #4360 changes content generation to OpenAI and requests the existing OpenAI key from Supabase.

## Scope

The change is limited to the existing content orchestrator. It does not start a new scheduler or publisher. The existing personal LinkedIn editorial contract, channel state transitions, deduplication and provider confirmation remain mandatory.

## Required acceptance

1. The approved model and provider for `supabase-bg-native-content-generate-v4` must be set to `OpenAI` and a compatible enabled model.
2. Validate the `OPENAI_API_KEY` in the production Edge Function runtime without exposing it.
3. Confirm OpenAI structured output meets required artifact schema; reject/refine invalid content.
4. Verify that the canonical publishing run records a real LinkedIn provider publication ID, not merely an internal queue ID.
5. Confirm Brain and activity ledger capture the outcome. Do not claim success until provider readback.

Current state: code proposed, production acceptance pending.
