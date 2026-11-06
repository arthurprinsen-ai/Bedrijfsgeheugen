# 2026-11-06 — original personal LinkedIn independent public-readback repair

- Fingerprint: `powerhouse|linkedin-personal|public-provider-readback-author-copy-date-urn|20261106-v1`.
- Existing provider side effect: `urn:li:share:7524468222708948994` accepted at 2026-11-06 13:50 UTC, canonical obligation still PUBLISHED, never republish.
- Original API GET returns HTTP 401/403, a permission limitation rather than evidence of deletion.
- Independently retrieved exact public post from original URL through ScrapeCreators; exact canonical content normalized equal, public author matches Arthur Prinsen, publication date 6 Nov; HTTP 200 via the **original Supabase runtime** Composio key and canonical user identity with pg_net request #22797. No side-effect create.
- Root cause: circular pre-existing original publisher gate requires LIVE_PROVEN to preserve independent public evidence, but cannot first create proof on PUBLISHED scope-limited provider readback.
- Fix: original social publisher's existing reconcile catch branch, exact public author/date/full copy/URN guards, no duplicate, no extra scheduler/writer. Fail closed on all mismatches; no new API permissions fabricated.
- Machine negative tests: tests/brain-linkedin-personal-independent-public-proof-20261106.test.mjs; protected Required/CodeQL, exact head, original runtime Edge deployment and readback required before PROVEN.
- Status: CODE_CANDIDATE until release/real original obligation change. Original source SHA and server version must independently match merged protected commit.
