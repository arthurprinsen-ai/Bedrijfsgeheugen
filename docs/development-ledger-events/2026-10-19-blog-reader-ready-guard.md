# Development ledger — OpenAI blog editorial readiness

Date: 2026-10-19  
Obligation-ID: blog-reader-ready-content-guard-20261019  
GitHub base SHA: 4a28a067585a32109333378b7120050840844ddf

Evidence: PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4483 included a generated dated article whose rendered lead contained `Voordat u publiceert:`. Direct Supabase source readback established this text was present in `powerhouse_content_artifacts.body`; no downstream sanitizer should silently publish it. The source's `final_copy_approved` was false.

Action: close PR #4483 before protected merge, preserve the dated obligation, and require reader-ready copy in the existing canonical static publication generator. Regression cases cover safe business-facing prose, editorial lead, live-release checklist, draft title and editorial CTA.

Scope: publisher, required prepublish regression, this ledger, human documentation, and Brain learning. No scheduler disablement, email consent bypass, model-provider fallback or false provider publication acknowledgement.

Not done: the invalid underlying editorial artifact still requires a supported content replacement/review and a separate exact public URL readback. A successful change to this gate alone is not a live article.
