# Development ledger — AI structured artifact truncated JSON

- Date: 2026-10-15
- Obligation-ID: `powerhouse-company-content-incomplete-json-retry-20261015`
- Canonical channel state: `linkedin_company` planned `publish`, remained `decided` with no company artifact, no provider delivery reference
- Observed failure: `Unterminated string in JSON at position 744`; 13 cooldown/retries on 2026-10-15
- Root source: `powerhouse-content-orchestrator` uses OpenAI strict `json_schema`, parses `output_text` with `JSON.parse`, and requests 1800 output tokens for LinkedIn generation; incomplete payload is not classified or retried with a larger budget
- Repair: classify explicit `status=incomplete, reason=max_output_tokens` or only truly incomplete JSON syntax; make exactly one bounded second OpenAI request with 3600 tokens for LinkedIn, using same unmodified input and strict schema
- Unchanged gates: strict 6-string schema, factual source evidence, independent personal editorial/identity review, final-text hash, corporate link, provider OAuth and post readback
- Tests: `tests/brain-content-artifact-incomplete-retry.test.mjs` for historical replay, shadow and canary
- External blockers separate: Supabase Actions token currently invalid (401); Anthropic static English translations insufficient credit (400); LinkedIn organization `r_organization_admin` scope absent
- Release status: unverified source candidate until Required/CodeQL pass, protected merge, authorized production Edge deployment and version/readback. This ledger does not report any publication.
