# Development ledger — OpenAI blog content quality before publication

Date: 2026-10-19  
Obligation-ID: openai-blog-reader-ready-generation-20261019  
GitHub base SHA: 4a28a067585a32109333378b7120050840844ddf

Observed source defect: 19 October blog body showed "Voordat u publiceert" and "Publicatiestap (vereist vóór live)" in the visitor HTML despite a valid provider key and successful static translation. PR #4483 was closed without merge.

Existing-state-first: the corrected source article in Supabase was read back; another authorized actor had already replaced the invalid text, so no conflicting content overwrite occurred. This change is preventive for future generated articles.

Action: extend existing Powerhouse content orchestrator's `blog` branch with reader-ready prompt, one constrained revision and failure before canonical artifact write. A dedicated test is explicitly wired into Required CI. This does not create another content worker, spam emails, bypass unique-story rules, forge marketing outcomes or mark a draft blog live.

Production truth boundary: merge and Supabase deployed-source parity must be observed; only publish the blog after protected website build, Netlify production deploy and exact public URL/content-ID readback.
