# Portal native legacy batch 10 — production outcome

Status: PRODUCTION_GREEN

- PR: #274
- Merge commit: `9ce54b399b1c9a2720f2037fd7152f834034cba0`
- Native workspace: `invoeren`
- Raw legacy input is retained as `legacyInputs` through the authenticated server projection.
- Changes remain a local draft until explicit Opslaan; the client only accepts the new state after server write and read-back of the same `inputEditId`.
- Last-known-good remains active on write/read-back failure.
- Production deploy: `6a93f14a5fac530008acf191`
- Netlify state: `ready`
- Redirect rules: 75, no errors
- Header rules: 16, no errors
- Functions: 7
- Edge functions: 1
- Secret scan: 0 matches

Operational learning: customer-state edits and imports use the same invariant: stage locally, require explicit confirmation, persist to the authenticated projection, and verify a unique operation marker by read-back before replacing last-known-good client state.
