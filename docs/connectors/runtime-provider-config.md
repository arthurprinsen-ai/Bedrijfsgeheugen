# Connector runtime provider configuration

This document records the server-side configuration contract for production connector safe tests. Provider URLs and credentials must never be returned by readiness endpoints.

## Environment variables

- `AFAS_SAFE_TEST_URL`: server-side safe-test endpoint for AFAS target writes.
- `EXACT_SAFE_TEST_URL`: server-side safe-test endpoint for Exact target writes.
- `DOCUMENT_EXTRACTOR_URL`: server-side safe-test endpoint for document extraction.

When a variable is absent, the associated capability remains fail-closed and readiness reports only `configured: false` / `state: not-configured` (or `sample-only` for extraction when explicit `extractedFields` are supplied).

All provider safe-test requests use `POST`, `content-type: application/json`, and `x-bg-safe-test: 1`. Secrets belong in server-side provider infrastructure or deployment environment only, never in browser payloads, readiness responses, logs, or repository files.
