# Original DataForSEO producer: protected Supabase Edge delivery declaration

**Date:** 12 November 2026  
**Original P0:** #4198  
**Source fix:** protected PR #5677 merged main `5ea1ae7dbab400e2d3e835e7cbaab7dab5356a8c`  
**Owner:** existing `powerhouse-dataforseo-intelligence` producer → original #105 SEO resolver → original #175 source archive → ONE BRAIN #140 → Heartbeat. **No new executor or scheduler.**

## Independently observed production state
- Original SEO resolver was deployed as version 530 with its new `planOriginalSeoKeywordCacheProjection` logic. Native Supabase migration `20261112203000_original_seo_keyword_tenant_alignment_v1` applied and original #175 function readback had the correct canonical source tenant, 7-day cache quality class and actual timestamp in revision hash.
- Original direct producer `powerhouse-dataforseo-intelligence` remained at version 12; provider source did not yet contain the new `NO_NEW_PROVIDER_KEYWORDS` status, despite the merged source commit.
- On `main`, `Supabase Edge Production Authority` run `43285163799`, job `131416515932`, failed with exact `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:powerhouse-dataforseo-intelligence`. This is a valid fail-closed protection, not a reason to bypass or deploy directly.

## Same-owner recovery
- Register precisely the existing original function once in `supabase/config.toml`, retaining its already deployed `verify_jwt=false` and existing internal `x-powerhouse-token` guard; explicit entrypoint, no secrets.
- Add regression to existing `tests/brain-original-seo-keyword-cache-bridge-20261112.test.mjs` verifying exactly one native declaration, preserved token gate and source-empty diagnostic.
- Retain Supabase GitHub Integration as sole source deployer, GitHub Actions as readback attestation, untouched original native database migration authority. Do not create a parallel provider collector, cron, provider token or unpublished checkout.

## Terminal proof requirement
Protected Required/BRAIN/CodeQL + merge exact SHA → Supabase deployed producer source byte-for-byte identical to protected `main` → `NO_NEW_PROVIDER_KEYWORDS` branch visible in provider readback → original next producer observation → original #105 projection and #175 + #140 consumer processed SHA ACK → Heartbeat/Portal and actual measured traffic, CTA, scan and qualified lead effect. Empty provider ranked keyword reports are **not** zero organic rankings and may never produce green fresh-keyword data.

**Not yet proven at source registration:** new provider data, finished campaign, new search traffic, a CRO experiment, revenue or a fully consumed Brain outcome.

## Original native migration source lock rechecked
After PR #5677, production Supabase independently reported exactly 834 applied native migrations on 12 Nov at 19:04:18.464 UTC, with latest exact identity `20261112203000/original_seo_keyword_tenant_alignment_v1`. The canonical GitHub migration history lock still had only the first 833. The next PR's protected preflight rightly failed on migration history parity, not on this already-applied migration. The current guarded recovery appends **only** this confirmed 834th version/name, preserves the 833 original immutable prefix, advances `captured_at` to the exact native readback time, and updates `tests/brain-original-provider-833-immutable-replay-lock-20261112.test.mjs` to assert immutable prefix plus native 834th source. No direct SQL write, migration replay, fake backdating, or new executor. Full native provider↔GitHub lock parity must be read back before terminal delivery.
