# Static English translation throttling — 24 September 2026

## Observed state

The production English build was correctly changed to fail closed: it no longer publishes Dutch copy under an English URL. The next release did not become the current successful Netlify deploy.

Netlify configuration readback confirmed that `ANTHROPIC_API_KEY` exists for the production build scope. The problem therefore was not a missing key.

## Root cause

The build translated the full public website with up to four concurrent provider workers. Provider failures were retried only four times with short linear delays and without honoring `Retry-After`. That is too bursty for a release-critical full-site translation job.

## Repair

- Default provider concurrency is now 1 and deliberately capped at 2.
- HTTP 429, 500, 502, 503, 504 and 529 use bounded exponential backoff.
- Numeric `Retry-After` is honored.
- Successful batches are paced by 750 ms.
- Production remains fail closed; retries never permit untranslated English output.
- The production source snapshot is refreshed so the exact production browser proof runs after merge.

No secret value is persisted in repository learning or documentation.
