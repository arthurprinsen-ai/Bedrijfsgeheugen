# Main-write integrity: one verified PR read, not five quota-consuming guesses

Date: 2026-10-23
Parent: [CI/agent delivery #4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661).
Canonical stateful recovery: [main-write integrity #3191](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3191).

## Proven incident

GitHub Actions [Main Write Integrity #39940563356](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39940563356) on main SHA `03bf825a6f4207df397f045ba0a3630faef34170` could not verify protected PR provenance and reported `UNKNOWN_MAIN_WRITE`. The detector made five provider attempts and then tried to paginate issues for incident upsert. GitHub returned **HTTP 403 installation rate limit exceeded**, causing `jq` to parse an error string instead of an issue array. An independent GitHub provider read of `commits/<sha>/pulls` confirmed the SHA belongs to legitimately merged PR #4762. This is **provider proof outage, not proof of a direct unauthorized write**.

## Targeted correction inside the existing control plane

For GitHub squash messages with `(#number)`, use the suffix only to select **one** REST PR endpoint; never trust the suffix itself. Accept only when the returned GitHub PR confirms numeric identity, `merged_at`, `base.ref=main` and exact `merge_commit_sha=HEAD`. If not confirmed, fall back to the original bounded independent commit association. If the provider signals primary or secondary rate limiting, do not perform any further PR-association or issue-write API calls in that execution. Preserve `UNKNOWN_MAIN_WRITE`, the existing immutable Actions artifact and the original terminal failing integrity check. A verified **negative** provider association still reports a true `DIRECT_MAIN_WRITE_INCIDENT` and uses the existing incident workflow.

## Testing and release

`tests/brain-main-write-integrity.test.mjs` replays the real merged #4762 receipt, tests forged hints, direct-write rejection, one-call fast path, 403/429 short-circuit, and unchanged fail-closed behavior. Keep the same `.github/workflows/main-write-integrity.yml`, no new cron, agent, issue registry or permission. All native Required, CodeQL, branch protection and postmerge readback remain intact.

A green PR is a candidate; the change is not proven live until protected merge, exact main-source hash and an actual main-write integrity readback. This correction reduces **maximum provider requests on verified squash merges from up to five to one** by construction, not a claim of measured p95 CI speedup or increased Github API quotas. Root cause of installation-wide rate saturation remains a shared resource-pressure issue for #4661; no unverified automatic quota bypass.
