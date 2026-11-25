# Blog-export slug boundary recovery — 23 October 2026

Parent: [canonical daily publication P0 #4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439). Obligation: `content|daily-blog|export-slug-boundary|20261023-v1`.

## Production evidence
The native daily blog GitHub run [39883989350](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39883989350), job 120187759613, failed at `Render canonical Powerhouse artifact` with `INVALID_SLUG`. Production `content_publication_obligations` has `2026-10-23/blog` GENERATED and no external post ID. Approved article SEO slug is absent; the active Supabase Edge export function generates a 70-character slug from title that ends in a hyphen because it truncates **after** separator normalization. Downstream static publisher correctly refuses the malformed URL.

## Small source correction
The canonical `powerhouse-blog-export` Edge function removes any trailing separator **after** `.slice(0,70)`. It does not remove the length cap, alter the title, generate a different date/identity, bypass the strict publisher regex, change tenant authority, or create another scheduler. Existing GENERATED-but-unpublished obligation can be reconciled to its new canonical slug by the existing export/publication route; do not directly rewrite production obligation/provider IDs.

## Proof before green
Positive/negative Node regression tests evaluate the actual pure slugify expression, including the exact 23 October input, long Unicode/punctuation examples, invalid/empty and path safety, publisher rejection and coherent content ID/URL. Required exact-head CI, CodeQL, Supabase Edge preview/deployed source evidence, a **single** existing daily publisher run and protected blog PR/Netlify public readback are mandatory. Content generated or a SQL cron success alone never means LIVE_PROVEN.
