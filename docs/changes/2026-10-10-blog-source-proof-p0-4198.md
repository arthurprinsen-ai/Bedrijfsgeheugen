# Blog source citations and SEO gate recovery — P0 #4198

## Proven failure
The 10 Oct canonical blog artifact was regenerated from the KVK Wet DBA source, but the existing GitHub daily blog run failed with `SEO order gate faalt: bewijs/bronnen ontbreekt`. The artifact's `generation_evidence` was a JSON-encoded string inside JSONB; the exporter treated it as an object and lost `recommendation_id`, preventing source attribution. No quality gate is disabled.

## Existing-owner repair
`powerhouse-blog-export` parses nested evidence and resolves the exact original `powerhouse_content_recommendations` row for the same day and `target_channel='blog'`, extracting the public HTTPS URL and title. Existing static `publish_powerhouse_blog_artifact.py` renders a visible linked **Bronnen en actualiteit** block, escaped, from that source — no invented facts or testimonial. After failed compilation, the canonical GitHub blog workflow discards temporary build mutations before checking out the existing same-date PR branch. Preserve exact reused PR #4300, strict SEO/i18n/CI, Netlify and public readback.

Do not equate a generated artifact or green source gate with live publication.
