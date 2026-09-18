# Runner capacity autorecovery — 2026-09-18

Fingerprint: `delivery|runner-capacity|autorecovery|v1`

## Incident
PR #2127 / obligation `powerhouse-delivery-self-optimization-proof-v1` remained mergeable on exact head `5ef62cb1d96591dc4a5fab2b5a66c158fa68ff26`, while Required, BRAIN and CodeQL stayed queued. A recovery-supervisor run was cancelled and was retried once; branch protection was not bypassed.

## Learning
Repository-wide/external runner saturation is transport capacity state, not evidence of a bad candidate. The safe strategy is to retain the current candidate and writer lease, avoid duplicate PRs/rebases, retry only failed/cancelled recovery work, preserve auto-merge and resume the same lineage when capacity returns.

## Prevention
This learning is promoted to the Powerhouse continuity skill, self-healing documentation and regression suite.
