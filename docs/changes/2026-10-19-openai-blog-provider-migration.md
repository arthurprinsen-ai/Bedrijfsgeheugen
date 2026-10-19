# Blog generation and publication — OpenAI-only provider migration

Date: 2026-10-19  
Obligation-ID: blog-openai-only-supply-and-translation-20261019  
Delivery-Lane: website

## Evidence-backed failure

Native approved supply GitHub run `39236467385` failed because the Anthropic Claude action required an unavailable GitHub OIDC token. Canonical Supabase-first daily blog GitHub run `39174978217` failed during pre-publication English translation because Anthropic returned HTTP 400 for insufficient credit. On 2026-10-19 the canonical publication obligation was still `GENERATED`, not `LIVE_PROVEN`.

## Change

- Native BRAIN-led supply uses `OPENAI_API_KEY` and a direct OpenAI Responses structured-output generator; no Claude action, OIDC or Anthropic credentials.
- A valid output contains the existing exact schema: title, slug, keyword, meta, blogtext and brain_reason. Word-count and formatting constraints are applied before writing the artifact; the existing workflow validates again before Notion approval.
- Canonical blog PR writer passes only OpenAI credentials to the already-implemented approved static translation transport. No fallback to Anthropic in the two publish steps.
- No authorization checks, translation cache completeness gates, protected merge checks or live readback are weakened.

## Acceptance

A passing regression test and required CI demonstrate wiring, not live publishing. Final production acceptance requires an actual authorized OpenAI request, valid article and durable EN cache, the protected merge and public production page identity readback. Without OpenAI API credit or credentials, fail closed and report the actual provider error.
