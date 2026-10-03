# Deploy-preview visibility retry policy

The public-page visibility sweep remains fail-closed, but Netlify deploy-previews now receive a slightly larger retry budget for transient access responses.

- production: 3 attempts, unchanged;
- deploy-preview: 5 attempts;
- deploy-preview backoff: 1s, 2s, 3s, 4s;
- only transient HTTP statuses are retried;
- persistent 403/429/5xx responses still fail the job.

This prevents a single short-lived preview 403 during the 741-check sweep from becoming a false delivery failure without weakening production validation.
