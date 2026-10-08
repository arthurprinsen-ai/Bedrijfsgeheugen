# Recovery obligation — terminal migration identity, 8 October 2026

- Fingerprint: `powerhouse|terminal-migration|exact-version-before-name|v1`
- Proven defect: terminal closure [run #37756633885](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37756633885) failed with false ambiguity on distinct Identity Graph migration versions.
- Cause: name-first reconciliation mistakenly rejected two genuine applied version identities.
- Correction: original terminal workflow, one tested resolver, exact version+name first, unique-name historical fallback only; ambiguous fallback still fail closed.
- Required verification: protected GitHub gates, merge, **new successful terminal closure of PR #4118**, migration readback.
- Source: [original merged PR #4118](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4118). No direct production mutation.
- Status: `PENDING_PROTECTED_DELIVERY` until all authoritative readbacks complete.
