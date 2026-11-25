# Development ledger — blog publisher provider migration

Date: 2026-10-19  
Obligation-ID: blog-openai-only-supply-and-translation-20261019  
GitHub base SHA: cb5bf7a8f9723239e08670b05488948cc2093ee7

Observed provider failures:
- Native Claude workflow: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39236467385
- Canonical blog Anthropic translation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39174978217

Committed remediation (candidate): native OpenAI-only blog generator, native blog workflow, canonical pre-publish OpenAI translation configuration and dedicated regression contract. The other publishing and approval surfaces are unchanged. No newsletter recipient permissions are altered and no unapproved email can be sent.

Evidence boundary: only mark blog `LIVE_PROVEN` after provider-authorized publication plus public site content-identity readback. Regression tests and a green preflight cannot independently prove a public post.

Supplementary legacy repair: removed Weekblog Anthropic HTTP-credit probe and both Weekblog/Blog bijwerken Claude Code actions, replacing with OpenAI Codex Action using least-privilege workspace permissions. All original file-scope publication checks retained. Full release still awaits Required CI and CodeQL.

## Outbound data minimization (CodeQL security review)

The OpenAI source generator no longer sends downloaded BRAIN learning JSON wholesale. It projects explicitly allowed aggregated numeric commercial outcomes and public `blog:<slug>` content identifiers, caps list lengths, and drops PII, email, contact/customer records, free-text instructions and URLs. An input containing no safe aggregate proof fails closed. Regression tests include injected private data and check that no forbidden values appear in the outbound request. Security review and CodeQL are reevaluated on the new head; this is not yet a provider send/readback.
