# Netlify protected release cancellation/starvation — 2026-10-19

Obligation-ID: `netlify-release-live-gap-starvation-20261019`.
Fingerprint: `deployment|latest-push-cancels-running-upload|20261019`.
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4442 .

**Before:** a manual forced Netlify release at run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39221955351 was cancelled after ~3 minutes by a newer push. The short HEAD^..HEAD applicability did not detect prior runtime changes still missing in production. Live source remained `d3a73d88...` while protected main advanced.

**Candidate:** use no-cancel running concurrency and an explicit last-live-sha ancestry diff; unknown identity fails closed. All authorization, CodeQL, protected-merge and live browser-proof checks remain in force. No fake green, provider approval changes or duplicate executor.

**Terminal:** only actual successful deploy + same source SHA Netlify readback + authenticated portal/browser proof may close. Tests: `tests/brain-netlify-live-gap-cancel-starvation-v1.test.mjs`.
