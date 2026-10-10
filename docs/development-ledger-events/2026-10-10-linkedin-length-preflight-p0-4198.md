# Development ledger — LinkedIn 3000-character provider fence
Date: 2026-10-10
Obligation: p0-4198-linkedin-provider-commentary-limit-20261010
Change: Canonical generation compacts LinkedIn commentary at complete paragraph/sentence boundaries to 2800 characters; canonical publisher rejects still-overlength payload before daily dispatch, uniqueness reservation or publication capability consumption.
Evidence: On 2026-10-10 personal commentary exceeded 3000 provider characters, LinkedIn Composio rejected with no post id, but local daily capability had been consumed.
Prevention: Keep pre-provider payload limit and existing channel-authority, provider identity, content-review and duplicate checks mandatory. Do not erase historical claim without exact no-side-effect reconciliation.
Test: tests/brain-linkedin-length-preflight-p0-4198.test.mjs
Operational status: candidate pending protected CI, Edge parity and external provider readback.
