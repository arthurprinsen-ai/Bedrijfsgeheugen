# One commercial closed loop v2 — repository closure

PR #3739 canonicalizes the commercial execution lineage into one runtime path and now also closes its repository-delivery evidence contract.

The material migration is accompanied by the required brain-learning record, development-ledger event, and this human-readable change record. This prevents a valid runtime change from becoming stranded behind the Integration Bundle closure gate.

## Delivery contract

The authoritative decision point is the complete check-run set for one exact commit SHA. Hygiene/admission, Required test, security checks, CodeQL and provider/build checks may not be combined across different HEADs.

A PR being mergeable is not sufficient evidence. Merge is allowed only after the exact HEAD is terminally acceptable. Production is only terminal after the merged commit is verified by the applicable runtime/readback path.

## Regression prevention

Future material Supabase or brain-runtime candidates that omit any required closure surface fail before release lanes can be treated as green. Retrying a failed preflight without correcting the missing evidence is explicitly non-terminal behavior.
