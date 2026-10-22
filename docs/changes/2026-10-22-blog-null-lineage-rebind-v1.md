# 2026-10-22 · Fix canonical blog metadata when original slug is SQL NULL

Fingerprint: `powerhouse|blog-null-canonical-lineage-rebind|20261022-v1`.
Owner: existing `powerhouse-blog-queue`; no new scheduler or publisher.
Parent obligation: `content-publication:2026-10-22:blog`.
Historical published HTML lineage: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4603.

After required CI, Netlify production deploy `6ad9ca0d0bcb05e8587a7908` was verified `ready` at 08:34 UTC with exact main SHA `38ddad15b819be8942ff05565b244b03cfbc4e57`. Canonical Supabase obligation nonetheless still had `GENERATED`, `slug=NULL`, `content_id=NULL`, `canonical_url=NULL`, no external ID or live proof. The queue's pre-provider repair guarded an update using `eq('slug', clean(o.slug))`. For old SQL NULL this becomes `slug = ''`, matches no record, and returns `BLOG_LINEAGE_REBIND_FAILED`.

**Cause-level fix:** use exact, null-safe CAS: `is('slug',null)` if original value is null/undefined, `eq('slug',old)` otherwise. The existing GENERATED-only and no-provider-side-effects preconditions remain intact. No external mutation occurs in the helper; the original `record_content_publication_state` remains the only writer of generated obligations. Do not falsely promote to `LIVE_PROVEN` without an independently verified public canonical/article readback.

Regressions: tests cover actual null vs empty string and stale/non-null original, reject previous publication and ambiguous provider effects, verify unchanged provider proof gates and shared canonical registration. Protected Required CI, CodeQL, Supabase deployment/readback and observed queue output required before closing the cause. Seven-day daily channel acceptance remains open in P0 #4439.
