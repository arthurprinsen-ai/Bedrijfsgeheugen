# Protect the daily OpenAI blog from editorial-only draft content

Date: 2026-10-19  
Obligation-ID: blog-reader-ready-content-guard-20261019

Root cause: the 19 October Powerhouse blog source was marked `content_ready` but the actual body contained internal instructions beginning `Voordat u publiceert:`, a `Publicatiestap (vereist vóór live)` checklist and a title with a draft qualifier. The generated PR #4483 displayed these sentences to website visitors. The source evidence also had `final_copy_approved=false`. It was unsafe to regard successful build, English translation and CodeQL as sufficient editorial approval.

The unsafe PR was closed before merge. This change introduces an early fail-closed reader-ready check in `tools/site-shell/publish_powerhouse_blog_artifact.py`; it rejects those exact classes of internal instructions before writing the dated article, RSS, sitemap or opening a protected PR. The gate does not rewrite or pretend to approve bad copy. The existing required blog prepublish test executes both positive and negative fixture cases.

OpenAI remains the blog and translation provider; no Anthropic call is reintroduced. Unapproved CRM email recipients, duplicate social posts and unsigned publication remain blocked.

Acceptance: successful test and protected merge of the guard; separately revise the source artifact with verifiable reader-ready copy, regenerate its scoped English cache, pass all release checks, and prove the exact public URL/content ID before claiming `LIVE_PROVEN`.
