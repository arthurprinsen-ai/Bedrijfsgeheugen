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
