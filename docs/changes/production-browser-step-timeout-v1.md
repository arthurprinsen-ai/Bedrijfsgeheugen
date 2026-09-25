# Production browser step timeout v1

Production readback already had internal Playwright/navigation budgets and a 25-minute job timeout. A wedged browser/protocol operation can still bypass an internal JavaScript budget until the job cap.

This recovery wraps the two production browser verifier commands in a GNU `timeout` process boundary:

- pricing/i18n production proof: 10 minutes;
- full public-page visibility proof: 10 minutes;
- hard kill fallback: 30 seconds after TERM;
- existing 25-minute job cap remains the final circuit breaker.

All browser assertions remain fail-closed.
