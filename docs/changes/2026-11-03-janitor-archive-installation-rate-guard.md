# Janitor archive installation API quota guard — 3 November 2026

**Original incident** [#5341](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5341); parent #5320, unrelated provider-tag permission issue #5333. Native [run #41595648620](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41595648620), archive job #125784745984, main source SHA `019016ddc50bcbfe354001a704ad1e9159c1e4c6`.

Three 403 permissions errors were correctly emitted as typed `CREATE_ARCHIVE_TAG` partial failures with no unique branch deletion, but the archive worker continued scanning commits and comparisons. At 07:29:04 UTC the GitHub installation returned HTTP403 **API rate limit exceeded for installation**, request `081B:53DBA:9F779:208D21:6AE98D40`; that exception occurred outside branch catch. It made the original job fail, but its cause had no typed artifact and was at risk of being mislabeled as a permission issue.

## Narrow correction
The **same original Janitor** rotates a bounded <=60 branch probe window according to the existing native run number; no new scheduler. As soon as three archive-tag permission errors occur, it stops ALL further API calls. Quota denial is classified separately as `PROVIDER_RATE_LIMIT_EXCEEDED` / #5341, and commit, comparison and initial inventory API failures all write redacted native evidence and return nonzero. No unsafe tag/delete fallback, scope expansion, permission change, or fake green. The machine report distinguishes `BOUNDED_WINDOW_VERIFIED_NOT_FULL_SWEEP` from `COMPLETE`. 

**Replay:** `tests/brain-branch-archive-sweep.test.mjs` covers 403 classification, window rotation, early stop, all-read catch and inventory incident artifact. **Release gates:** exact head Required/CodeQL/BRAIN, protected merge, original next natural Janitor provider readback, original ONE BRAIN and portal truth. The tag-write authorization and four GitHub queue ghosts remain separate open provider incidents.
