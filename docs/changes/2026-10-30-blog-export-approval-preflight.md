# Original blog export gate: expected approval versus technical failure (30 October 2026)

## Observed evidence
Original GitHub daily blog runs 40954413989 (29 October) and 40982375638 (30 October) failed at `Render canonical Powerhouse artifact` with HTTP 403. Original Supabase `powerhouse-blog-export` v240 requires `Authorization: Bearer <service-role-key>` and **both `approved_at != null` and status APPROVED/PUBLISHED/LIVE_PROVEN** before returning a blog artifact. Original 29/30 Oct obligations actually have status GENERATED and approved_at NULL, while channel decision=publish and content artifact is content_ready. There is no evidence that the article was published.

## Source fix in original authority
- The original `publish_powerhouse_blog_artifact.py` parses only the exporter response `BLOG_PUBLIC_EXPORT_NOT_APPROVED` with an *exact date match* and returns a typed `NO_ACTION:AWAITING_ORIGINAL_PUBLICATION_APPROVAL` sentinel. Any other 403 (especially invalid key/security issues) remains a failing HTTPError.
- Original hourly `powerhouse-daily-blog.yml` records a distinct **approval_state** and explicit notice. The render step returns `changed=false`; no duplicate PR, website artifact, Netlify deploy, publish receipt or second scheduler occurs.
- This branch does not approve the blog or alter `content_publication_obligations`. The original content/reviewer owner must approve through the existing authorized review path; a green GitHub poll is not a live post.
- Preserve exact GitHub protected merge, Netlify SHA, public canonical browser readback before LIVE_PROVEN.
- Regression `tests/brain-blog-original-approval-and-terminal-proof-20261030.test.mjs` tests typed exporter HTTP403 with exact date, 403 unexpected, wrong date, HTTP401, HTTP404 and no-output main path; plus original BRAIN terminal proof interpretation.
- Cross-agent warning: original PR #5146 merged and exact-head Required/CodeQL passed but original Obligation Terminal Closure #40957939814 failed because exact-candidate `Unified Brain Delivery` dispatch was missing. Distinct main push Brain foundation and Revenue Learning success may NOT substitute for that proof. The original BRAIN dispatcher must provide it in its original lineage; no alternative scheduler.

This is a **candidate only** until protected PR CI, source merge, deployment and readback. No provider action or approval was simulated. See [canonical incident #4918](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918#issuecomment-6516368957).
