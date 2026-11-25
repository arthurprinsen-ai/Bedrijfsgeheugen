# Original daily blog — preserve source intent in SEO title and keyword

**Date:** 2026-11-15  
**Existing parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198  
**Original daily article:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5833  
**Executor:** existing Supabase-first `powerhouse_content_artifacts` → `tools/site-shell/publish_powerhouse_blog_artifact.py` → `scripts/ci/blog_technical_seo_gate.py` → protected original `powerhouse-daily-blog.yml` → Netlify → provider+ONE BRAIN+Heartbeat readback.

## Reproduced production-source defect
The canonical 15-Nov Supabase content artifact has title `Stap‑voor‑stap: MKB klaarmaken voor integratie tussen boekhouding en mobiele betaalapps`, content status `content_ready` and body discussing matching PSP/mobile payments against a bookkeeping ledger. The existing unmerged original PR #5833 generated `<title>Stap: wat verandert er voor jou?</title>`, `<meta name="bg-zoekwoord" content="Stap">`, the same uninformative H1, JSON-LD headline, blog card and RSS title. The source-to-SEO transform accidentally erased the actual business topic because `seo_focus` allowed an imperative generic first word and `seo_title` substituted generic templates for long source titles. Existing technical preflight checked title/keyword token overlap but did not reject topic-less terms.

## Narrow same-owner corrective behavior
- `seo_focus` keeps legitimate explicit focus terms and source-supported one-word brand terms (e.g. Twinfield) but ignores generic seeds like `Stap`. For a title explicitly describing an integration `tussen X en Y`, preserve the original full named subject pair when it appears in the source title and stays within a bounded word/length threshold.
- `seo_title` preserves connected system nouns instead of replacing a long title with `wat verandert er voor jou?`. For other long titles, use a bounded, meaningful source-derived truncation; do not make up API availability, facts, lead metrics or financial outcomes.
- The existing `scripts/ci/blog_technical_seo_gate.py` checks topic specificity before mechanical keyword-token matching and rejects generic single-word SEO placeholders or generic question templates, but does not ban valid one-word product/brand topics.
- Existing negative/positive regression tests assert the exact 15-Nov failure fingerprint, topic preservation, legitimate Twinfield behavior, absence of unrelated external actions/new publisher and prepublication gate connection. Existing SEO/CRO skill, original ONE BRAIN causal lesson and append-only ledger are part of the same protected candidate.

## Independent closing requirements
A Git merge **does not publish** the held old article. The canonical editorial source of 15-Nov must independently pass first-party fact checking; exploratory Twinfield API timing remains explicitly **UNVERIFIED** until dated vendor proof. Original Blog owner then regenerates the **same date/slug/idempotency record** with corrected source metadata, updates main's blog index/RSS/sitemap **additively**, and uses exact-head Required/CodeQL, protected main merge, real Netlify/public GET/canonical/readback. Only the original BRAIN content consumer may then mark `LIVE_PROVEN`, and real numbers/experiments/financial effects/next-run learning are separately due. Do not create a second publisher, omit the source gate, force-merge PR #5833, claim today's article live, or stop any canonical scheduler.

## Proof boundary
This PR repairs the original generator and gate *source code*. Before protected merge and re-render+provider readback, mark `CANDIDATE`, not `LIVE_PROVEN`. The source article's unsupported forecasting claim remains a separate editorial task, not silently corrected by changing metadata.
