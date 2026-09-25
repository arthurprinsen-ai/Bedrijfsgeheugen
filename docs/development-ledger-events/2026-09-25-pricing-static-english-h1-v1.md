# 2026-09-25 — pricing static English H1 recovery

Observed:
- production `commit_ref` equalled protected `main` at `89cc01bf96104a4436205567e7ff71850911d858`;
- NL→EN navigation reached `/en/prijzen`;
- production snapshot run `36164078579` failed because the Dutch pricing H1 was still visible on the English route.

Root cause:
- localized content authority, not deployment transport or route switching;
- the static translation cache required a deterministic override for the pricing H1.

Action:
- add `config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json`;
- map the Dutch H1 to `Pricing for SME digitalisation`;
- add regression, Brain learning and human documentation;
- retain exact-main plus browser-content proof as terminal requirements.
