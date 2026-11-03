# Original experimentcyclus OpenAI-only migration — 2026-11-03

Canonical issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Original source evidence
Production Supabase original Edge `bg-experimentcyclus` is ACTIVE v8, sha256 `950b7ce0ce75b127ca89d01df959ad4347b418b7168e99d553212dfd5c0faa20` and was absent from GitHub at `supabase/functions/bg-experimentcyclus/index.ts`. Original weekly cron job 23 runs Mondays 06:40 UTC. `supabase-bg-experimentcyclus-v1` remains canonical approved ACTIVE Anthropic and runtime v8 calls Anthropic when there are no pending experiments and >=150 visitors within 30 days. Original provider key `OPENAI_API_KEY` is present in Supabase secure Vault. At source inventory, 62 ACTIVE/PLANNED experiments cause original no-new-proposal gate.

## Source change, behavior invariants
Restore original live v8 function source as the sole versioned GitHub authority. Keep CRO SQL poort, original human decision, source page and funnel aggregation, minimum traffic, one experiment at once, original `bg_bewijs` and weekly cron. Replace legacy Anthropic endpoint and key with original OpenAI Chat Completions, `gpt-5-mini` supplied by specific approved canonical provider/model, forced `voorstel` tool, exact existing typed schema and actual source page validation, fail closed on invalid/missing/refused results. No new scheduler, writer, marketing send or alternate AI provider.

## Mandatory release / security
This change has no false GREEN. Protected original PR, Required/BRAIN/CodeQL, System Map, writer lease and exact main merge before deployment. Only then bounded canonical governance update of `supabase-bg-experimentcyclus-v1` from Anthropic to OpenAI with explicit owner directive, data/subprocessor review, preserved restricted data. Compare original production v8 exact sha prior to deploy, then independent original function version/source readback, natural cron result and actual model response when original traffic/pending-experiment gate permits. The current 62 pending experiments mean a successful `geen nieuw voorstel` is NOT proof the model ran. The existing public/unauthed Edge cron caller requires a separate security handover and regression, not an unverified auth change that disables weekly execution.
