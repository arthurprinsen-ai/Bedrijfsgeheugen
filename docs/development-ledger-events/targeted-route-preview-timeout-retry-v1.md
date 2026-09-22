# Targeted route preview timeout retry

The affected-route browser gate now distinguishes a provider cold-start timeout from a real website regression.

Only Playwright `TimeoutError` from navigation is retryable. The verifier makes at most three attempts with bounded backoff. All other errors, failed assets, page errors, canonical mismatches, missing visible content, and non-2xx responses remain fail-closed.

This prevents a transient Netlify preview startup from falsely blocking an otherwise valid release without weakening browser regression coverage.
