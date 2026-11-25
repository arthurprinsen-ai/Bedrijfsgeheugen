# Migration-only terminal release: canonical provider proof

## Verified defect
PR #4169 was protected-merged to main (merge 22dec8d4af0dd63b7ea6b871fe407d712ccd2cfd). Official Supabase production migration history records 20261008162000; production runtime emitted three bounded review-required learning candidates. However, obligation-closure job 113383658453 failed PRODUCTION_DESCENDANT_READBACK_NOT_PROVEN. Its migration fast path mistook verifier-only .agents and platform/system-map files for deployed runtime and then waited for a Netlify release that cannot represent this Supabase-only change.

## Repair
Use the already canonical terminal scope classifier, plus an exact versioned migration filename requirement. A migration with only recognized nonproduction/verifier evidence takes the existing Supabase provider migration readback path; other scopes remain fail-closed and take their correct authority paths. Tests cover the original seven-file PR and negative cases for website, Edge, unknown runtime and malformed migrations.

## Boundaries
Do not bypass protected checks, forge Netlify release SHA, change Supabase production migration history or create another control plane. The previous failed terminal run is not retrospectively marked successful; an authorized reconciliation or new verified release evidence is required. No real-world value improvement is inferred from the deployment alone.

## Explicit authority separation
Netlify website identity is not a substitute for Supabase migration history. The replay workflow must query the official production Supabase migration ledger for the exact version and retain the result in its canonical terminal evidence.
