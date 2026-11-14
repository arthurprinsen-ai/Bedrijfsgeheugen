# 14 november 2026 — bron-URL van Google News naar canonieke Mira-radar

Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
Original owner: `powerhouse-mira-problem-radar-v1`, original cron #120. No second scheduler/publisher/search bill.
Baseline: original authenticated Supabase pg_net `31064`, HTTP 503, 14 provider candidates, 14 URL-quality rejections, 0 stored, 0 eligible. All rejected examples had host google.com. This is the first independently measured, exhaustive reason for today's source starvation. The older #31043 had 21 results with no rejection taxonomy.

## Root cause / narrow patch
Google News results may supply an intermediary `google.com/url`, whereas the immutable `classifyMiraSourceUrl` correctly refuses redirects and Google search pages. The provider mapper ignored the accompanying declared publisher `domain`. The new **pure parser** `mira-dataforseo-publisher-url.mjs` admits only explicit HTTPS article URLs already present as `url` or `q` in a `google.com/url` or `google.nl/url` query, only if the DataForSEO-provided `domain` matches the actual external publisher host. No network redirect following, scraping, fabricated attribution, Google opaque article decoding or `url` query key bypass on the actual article URL. The original URL-quality classifier is still run after this bridge. The original 45-day date, original canonical PH-P scene, scoring >=0.72, independent 90-day URL/hash dedupe and three-day topic dedupe remain untouched.

Opaque `news.google.com/articles`, a Google search endpoint, absent/ambiguous explicit target, insecure http, local/private host, unrelated publisher domain, credentials, nested redirect or unsafe target remain rejected with typed reason and URL shape. The bounded original `sourceIntake` counters and original ONE BRAIN `brain_observe_failure` continue to carry real zero-source evidence. The original radar still makes 8 daily provider searches only (six business, two personal).

## Single Powerhouse → Brain → Heartbeat path
Original radar → source materializer + immutable winner → exclusive original OpenArt media job claim, verified exact project and approved credit budget → native portrait, silent and temporal proof, independent Mira identity >=0.940 in three frames → original `powerhouse-social-publisher` Composio/Meta create and matching provider GET → original `content_publication_obligations` LIVE_PROVEN → original ONE BRAIN `CONTENT_HANDOFF` consumer processed ACK via original #171 → Heartbeat/CRO and Portal V2 measurement/learning. All required receipts share original tenant+date+channel+source revision and correlation ID. No new worker, cron, publisher, auto-paid generation or false green.

## Verification and state
- `node --test tests/brain-mira-dataforseo-publisher-url-20261114.test.mjs`; full protected Required, CodeQL and native migration/source parity.
- Protected merge, independent Supabase Edge source equality (not just READY).
- At most one post-deploy authenticated original radar probe: inspect actual `sourceIntake` and dated original winner; lack of explicit URLs still remains OPEN.
- Original OpenArt connected account showed **zero credits** at 14 Nov; the actual production billing scope must be verified independently before spending. No unsupported promise of a new reel.
- Actual new Instagram post ID/permalink and original consumer PROCESSED ACK are the only final outcome proof.

Status: CODE_CANDIDATE, NOT A PUBLISHED POST.
