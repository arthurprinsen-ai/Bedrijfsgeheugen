# Manual v6 writer bootstrap — protected admission closure

## Scope
PR #4969 proposes a hand-triggered GitHub Actions entrypoint under the existing Powerhouse Delivery Recovery Supervisor. Pull-request changes trigger only read-only regression checks; scheduled recovery retains its original schedule. Runtime handoff requires the protected `writer-patch-approval` Environment.

## Failure and correction
The GitHub hygiene admission phase accepted the candidate metadata but rejected the material change because required Brain learning, activity ledger and human-readable closure evidence were absent. This change adds those three artifacts; no required gate is weakened.

## Controls
The configured path policy remains `paths: []` (deny all). The trusted handoff manifest is absent. As a result, recovery patch publication is not authorized. Protected merge and independent production readback are still required, and the code must be fully revalidated at the final SHA.

## Verification plan
Run the existing exact-head v6 regression job; inspect hygiene and Required outcome on that same SHA. Do not claim green based on historical runs. Before any publishing test, separately review a minimal allowed-path policy and complete SHA256-bound manifest for PR #4967. Keep a single exclusive Supabase lease holder.
