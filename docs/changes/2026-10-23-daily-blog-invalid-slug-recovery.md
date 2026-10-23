# Daily blog INVALID_SLUG, 23 October 2026

- GitHub failed run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39883989350
- Exact failing slug: `cyberdreigingen-voor-ondernemers-een-praktisch-beslis-en-oefenplan-om-`; corrected canonical slug: `cyberdreigingen-voor-ondernemers-een-praktisch-beslis-en-oefenplan-om`.
- Confirmed source: old queue/export slugifier did `.slice(0,70)` after removing leading/trailing separators, retaining the separator introduced by truncation.
- Original Supabase obligation `content-publication:2026-10-23:blog` is `GENERATED`, not published; external_id/published_at/live_proven_at are all null.
- This patch unifies the two source functions; rejects invalid explicit editorial slugs without altering them; leaves the existing no-external-side-effect CAS as the only safe rebind.
- Test: `node --test tests/brain-canonical-blog-slug-truncation-v1.test.mjs tests/brain-powerhouse-blog-null-lineage-rebind-v1.test.mjs`
- Release requires exact-head Required/CodeQL, protected merge, Supabase redeploy of both functions, guarded original obligation rebind, same-day daily blog rerun, normal blog candidate/SEO/i18n publication checks, Netlify production and canonical/content-id readback.
- Do NOT create a parallel scheduler, weaken quality gates, update published rows or claim LIVE_PROVEN before independent readback.
