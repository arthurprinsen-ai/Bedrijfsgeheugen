# OpenAI blog SEO metadata generation recovery

Date: 2026-10-19  
Obligation-ID: openai-approved-blog-meta-length-recovery-20261019

## Evidence and root cause
A manual GitHub dispatch of the existing **Native approved blog supply** succeeded in authenticating with OpenAI and generated a response, but job `118206382421`, run [39295376055](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39295376055), failed before publishing with `OPENAI_BLOG_META_INVALID`. The provider is not the failure: the SEO field missed the explicit 120–170 character contract.

## Fix
Keep the canonical OpenAI-only writer and model as-is. If the generated SEO summary is too long, shorten it at a word boundary from the model's existing text. If it is too short, use a bounded excerpt from the generated article introduction. Reject inputs that cannot be repaired. The existing complete `validateApprovedBlog` gate executes unchanged on all substantive article content and the final SEO meta.

This cannot turn the generator into a bypass of Notion article quality, recipient approval, duplicate prevention, or protected merge. All publication and provider verification remains separate. The regression canary asserts repair, unchanged content, fail-closed behavior, and SEO compliance.

Production acceptance is **not** implied by a GitHub source commit or green preflight. Require full PR CI, protected merge, a genuine native supply run ending `NATIVE_APPROVED_BLOG_CREATED` or a clearly grounded `NO_ACTION_APPROVED_STOCK_EXISTS`, and subsequent provider/website readback.
