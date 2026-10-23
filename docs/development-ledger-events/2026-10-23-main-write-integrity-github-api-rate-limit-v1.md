# Append-only ledger — GitHub installation rate limit during main provenance verification

- **Observed at:** 2026-10-23T10:38:54Z
- **Workflow:** [Main Write Integrity #39940563356](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39940563356)
- **Immutable main SHA:** `03bf825a6f4207df397f045ba0a3630faef34170`
- **Independent provider verification:** [protected merged PR #4762](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4762), exact `merge_commit_sha`
- **Error:** `gh: API rate limit exceeded for installation (HTTP 403)`; `jq: Cannot index string with string "pull_request"`
- **Historical behavior:** 5 provider proof attempts, then paginated issue search/update attempt; failed job. `UNKNOWN_MAIN_WRITE` classified *unverified*, not unauthorized.
- **Candidate:** one provider-verified PR read first (suffix as untrusted lookup), fallback association for unresolved cases, **immediate stop on rate limit**, explicit source marker, no incident-write fanout while quota exhausted. Existing red CI gate and immutable proof remain untouched.
- **Canonical owners:** [CI #4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661) and [main-write incident #3191](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3191).
- **Evidence acceptance:** exact-head Required/CodeQL and real subsequent main readback. A rate-limited response never proves authorized or unauthorized state. No second scheduler, bypass, key, queue, direct main mutation, altered customer ACL or fake faster-build claim.
