# 12-11-2026 — source-verified first-party blog side effect incorrectly blocked as unpublished

- **Incident:** #4198. **Owner:** original Powerhouse content assurance / #171. **Original datum:** 2026-10-25.
- **Observed cause:** `v_pub` globally demanded `external_id`. A blog does not always use this social provider column.
- **Independent evidence:** first-party blog public HTTP status 200, original production Netlify deployment ID 6addd26df8c80a10be5828d9, original live timestamp and canonical HTTPS URL in existing `content_publication_obligations`. Before: `MEASURED` source while BRAIN classified `OVERDUE_PUBLICATION`.
- **Repair:** one protected migration correcting only channel-specific provider identity in the existing source-to-consumer function. Preserve original row IDs, tenant, owner and source revision; all analytics gates, 24/48/72h social metrics and later learning proof unchanged.
- **Regression:** `tests/brain-original-blog-netlify-provider-proof-20261112.test.mjs`; `brain/learning/2026-11-12-blog-netlify-original-handoff-identity-v1.json`.
- **Required release proof:** Required + CodeQL green, protected auto-merge, native Supabase migration readback, exact live pg_get_functiondef, original #171 assurance readback. No success claim for absent GA4/GSC or outcomes.
