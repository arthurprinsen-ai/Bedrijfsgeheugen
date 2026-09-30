# Bilingual SEO Netlify build parity

Netlify production was running the new bilingual SEO stages, but the GitHub website premerge parity job still used the older build sequence. That allowed a production-only build failure.

The website lane now runs the same relevant order as production:

SEO order apply → SEO order validate → static i18n → localized routes → bilingual revenue links → sitemap → localized SEO/revenue validation → release evidence.

A Brain regression enforces this sequence. The production heartbeat in the same lineage exists only to retry deployment after the parity fix.
