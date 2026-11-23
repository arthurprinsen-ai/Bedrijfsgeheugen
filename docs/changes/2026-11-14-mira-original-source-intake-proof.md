# 2026-11-14 — Mira original source-intake rejection audit, no second writer

Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
Canonical owner: existing `powerhouse-mira-problem-radar-v1` / cron #120 / original source materializer.
Scope: one original Edge source collector, original agent and Instagram publisher skill. No new cron, provider, social writer, schema, direct Instagram action or extra search costs.

## Production cause verified before this change

At 2026-11-14 ~13:22 UTC the originally authorised `powerhouse-mira-problem-radar` was explicitly invoked for Amsterdam business date 2026-11-14. Original pg_net request **31043** returned HTTP **503** `SOURCE_RECOVERY_DUE`, `NO_FRESH_PUBLIC_PROBLEM_SIGNAL`. It reported DataForSEO news result count **21**, empty-result task count **2**, stored **0**, eligible **0**, errors **[]**. The new immutable Mira winner was missing for 10–14 November. Original Instagram media jobs for 5–9 November were WAITING_ASSET, attempts=0, empty proof manifest. The original Instagram BUSINESS account @bedrijfsgeheugen.nl was independently readable; it is not an OAuth reconnect problem. Original blog/LinkedIn channel outcomes do not close Instagram obligations.

Crucial diagnostic gap: the original radar counted provider results but discarded candidates silently for URL quality, topic mismatch, duplicate, channel contract collision or date/score, so the real production reason that 21 provider items became zero sources was not visible to the owner. Guessing which gate rejected them risks unsafe relaxation or needless repeated provider calls.

## Narrow source code remedy

Within the EXISTING radar, add bounded `sourceIntake` with `providerCandidates`, reasoned counts and max-eight public news-domain/title examples. The same evidence is sent to the original `brain_observe_failure` recurrence when no unique eligible source exists. There is no new source, eligibility override, paid call, publisher, scheduler or source URL canonicalization. All 45-day/date, source URL quality, 0.72 score, PH-P topic mapping, original 90-day source and 3-day topic dedupe, independent Mira identity and provider proof gates remain authoritative.

The existing agents/skill now explicitly require the original source radar owner to consume the breakdown and make one bounded, evidence-based source fix; separately, the frozen-winner media job must be exclusively claimed by the original authorised OpenArt producer and produce exact independent proof before the original social publisher can send.

## Verification plan and definition of done

1. Protected Required+CodeQL, protected main merge, independent original Supabase production Edge version/source readback.
2. Re-run the same originally authenticated radar once; read `sourceIntake` and correlate provider candidates to actual reject reasons. Use the result to repair only the evidenced cause in the same owner (new source requires genuine dated independent URL and exact PH-P match).
3. Verify immutable daily winner + original media job claim + 1080×1920/mute/identity ≥0.940/temporal ≥0.900 verified final asset.
4. Verify exact original canonical Instagram provider media ID and permalink via independent Meta readback, original `content_publication_obligations.live_proven_at`, original ONE BRAIN consumer PROCESSED ACK, and subsequent measurements.
5. Keep this incident OPEN until those provider and downstream receipts exist. This code candidate by itself is NOT an Instagram post or a production recovery.

Regression: `node --test tests/brain-mira-original-provider-rejections-20261114.test.mjs` and existing original Mira tests.
