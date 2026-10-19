# OpenAI blog: generation must be reader-ready

Date: 2026-10-19  
Obligation-ID: openai-blog-reader-ready-generation-20261019

The OpenAI provider migration was successful, but one canonical Powerhouse article still contained internal publication, canonical ownership and SEO reviewer instructions. PR #4483 was closed before merge. The static output publisher now has a separate fail-closed guard (PR #4484).

This change repairs the source generator in the **existing** `powerhouse-content-orchestrator`:
- Select a dedicated OpenAI blog-only reader-facing editorial prompt.
- Check minimum copy and at least three Markdown subsections, public-facing title, public-facing CTA and absence of internal publisher instructions.
- Allow one bounded OpenAI revision using the same verified recommendation evidence, then repeat the exact deterministic checks.
- Refuse `content_ready` writes if the final copy still fails.
- Record `automated_blog_reader_ready` and editorial policy version without misrepresenting an automated decision as human signoff.
- Keep provider and tenant authority, source lineage, canonical publication, duplicate safety, EU data governance and outbound email gates unchanged.

The existing Required CI prepublish contract runs a regression test that executes the guard on valid copy, editorial instructions, draft titles and misleading CTAs.

A green test alone does not mean the runtime was deployed or today's article is live. Source parity, Supabase deployment readback, protected daily blog PR, full English cache, Netlify published deploy and public article ID are still separate completion requirements.
