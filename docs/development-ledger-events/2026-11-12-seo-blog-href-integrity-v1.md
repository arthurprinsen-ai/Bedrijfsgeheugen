# SEO blog href integrity — 2026-11-12

- Original obligation: `seo|blog-href-canonical-integrity|20261112-v1`; root coordination: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198; release candidate: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5636.
- Owner: existing Powerhouse SEO Order Engine / BG169 and original blog publisher. No second scheduler or writer.
- Observed source defect: `scripts/ci/blog_technical_seo_gate.py` checked number/category of internal links in new article HTML but not whether every `href` actually matched a canonical destination in final sitemap. Could allow links to unpublished/dead first-party routes.
- Cause: link-count gate without target resolution; not a claim that every already-published article has broken links.
- Safe bounded repair: parse final sitemap once, reject empty, unapproved schemes, non-HTTPS, non-canonical first-party hostname, and same-origin targets absent from final sitemap before approved publication. Preserve valid root-relative links and require complete HTTPS external links. Daily original production crawler owns independent HTTP/redirect monitoring.
- Historical regression: `tests/brain-blog-href-integrity-20261112.test.mjs` executes Python to verify accepted canonical links and reject invalid/missing targets; 2026-11-12 native Required run 43206696622 independently reported the historical replay passed.
- Initial CI failed learning metadata (`LEARNING_FAILURE_CLASS_REQUIRED`), fixed with explicit compiler/evaluation. Second run rejected missing `activity_ledger`; this event and semantic learning evidence repair it without weakening Required or branch protection.
- Prevention: any future technical SEO release with new content link contracts must include same-lineage full destination verification, learning, regression, development ledger, human-readable documentation and original protected release.
- Production state: **CANDIDATE / NOT LIVE PROVEN** until new exact-head Required/BRAIN/CodeQL and protected merge, Netlify current main exact-SHA READY and public route readback; no AI citations or paid outcomes claimed from static links.
- Handoff: source proof -> original BG169 writer -> ONE BRAIN owner ACK -> Powerhouse/Heartbeat -> Portal -> next original daily keyword, AI-answer and conversion experiment decision. Missing provider answer/citation is `NOT_MEASURED`, not zero.
