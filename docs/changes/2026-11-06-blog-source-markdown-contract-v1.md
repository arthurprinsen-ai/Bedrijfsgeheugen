# Blog source Markdown block contract — 6 November 2026

## Independent root cause
The seven already-repaired public pages were damaged by the renderer, but the original Supabase blog artifact source also contains adjacent `##` headings, body lines and `- ` lists with no blank-line boundaries. The original protected publisher cannot infer intended block structure reliably from such input in every future variation. The service-only exporter forwarded `body:clean(a.body)` without normalization; the original content orchestrator did not instruct the generator to delimit Markdown blocks.

## Scoped correction
- The **existing** blog generation prompt now requires separate heading lines, blank lines surrounding headings/lists, and genuine questions only when supported by the article.
- The original `powerhouse-content-orchestrator` normalizes the blog text **before** the existing reader-ready gate, SHA and Supabase `powerhouse_content_artifacts` write, including permitted revised drafts. It changes separators only, not the facts, copy or authorization.
- The existing authenticated `powerhouse-blog-export` applies the *same* pure helper to already approved legacy source text on export. The original service-role authorization, approval gate, slug, provenance, anti-duplicate lineage and publication route remain untouched.
- One deterministic Node regression validates mixed paragraph/list/heading blocks, numbered lists, indentation, idempotence and both call sites. No duplicate scheduler, renderer or synthetic FAQ is introduced.

## Scope and boundaries
New generation sources gain normalized boundaries; historical Supabase rows are intentionally not mass-updated. Historical published HTML remains under its earlier repair. A source paragraph that contains genuine newlines within ordinary prose is preserved. Nested bullet indentation is preserved in text; current static renderer may still flatten visual nesting.

## Production acceptance
Protected GitHub Required + CodeQL + original BRAIN checks; the original Supabase deployment mechanism deploys exact matching revisions of the **two existing** functions and the shared helper; independent function versions/source SHA readback; next original natural blog artifact in Supabase has separated Markdown blocks; original approved export matches normalized source; protected site build and public NL/EN readback. Do not mark LIVE_GREEN from PR creation alone. If release is blocked, retain this branch and owner evidence; no direct unreviewed parallel deploy.
