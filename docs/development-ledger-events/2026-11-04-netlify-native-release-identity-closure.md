# Development ledger — Netlify production identity recovery

- Date: 2026-11-04.
- Canonical owner: original production delivery owner; no second scheduler, writer, publisher or bypass.
- Fingerprint: `netlify|native-git|production-release-identity-unavailable|20261104-v1`.
- Evidence: Netlify deployment `6aeb634d6ff9a5039dfeb1e2` failed; production `COMMIT_REF` missing or invalid is the suspected direct identity gate input. Exact missing field remains to be confirmed by diagnostic readback.
- Correction: verified Git HEAD fallback when `COMMIT_REF` absent; fail closed on supplied SHA mismatch or invalidity, absent DEPLOY_ID and invalid CONTEXT.
- Prevention: maintain immutable release identity and test exact deployed commit; never infer live from merged source alone.
- Verification: PR #5425 candidate; Required, CodeQL, original deployment and independent production DOM/readback outstanding.
