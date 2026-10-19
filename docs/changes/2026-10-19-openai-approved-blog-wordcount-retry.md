# OpenAI approved blog — bounded word-count regeneration

Date: 2026-10-19
Obligation-ID: native-approved-blog-bounded-wordcount-retry-20261019

## Incident and cause
The native approved blog supply run [39303086998](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39303086998) connected to OpenAI but failed with `OPENAI_BLOG_WORD_COUNT_INVALID` before Notion. The 900–1500 word quality gate was correct; one-shot generation was not resilient to model output length variance.

## Controlled intervention
The existing `generateApprovedBlog` requests 1100–1250 words and retries **only** word-count validation failures, at most three total OpenAI calls. It passes every candidate through the existing unchanged validator, and sends only sanitized aggregated BRAIN signals. Unrelated quality errors and provider failures still stop immediately. Notion receives only one fully valid candidate.

## Evidence and terminal acceptance
- Regression: `tests/brain-openai-blog-bounded-wordcount-retry-20261019.test.mjs`
- Canonical Brain learning: `brain/learning/2026-10-19-openai-blog-wordcount-bounded-retry.json`
- Required CI, CodeQL and protected squash merge remain mandatory.
- Verify live native supply creates a next-day Notion record and read back its exact fields. Do not claim public delivery from an approved stock record alone.
