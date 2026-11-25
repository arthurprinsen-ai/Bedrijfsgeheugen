# Development ledger — protected manual v6 bootstrap admission
Date: 2026-10-27
Obligation: manual-v6-writer-bootstrap-20261027
Pull request: #4969
Observed candidate: daf413bf50e803a4087730ffbfab1d0b60b49067

## Observed failure
GitHub Actions hygiene job 122088683772 admitted the candidate, then failed protected integration closure with `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: activity_ledger,brain_learning,human_documentation`.

## Root cause
Material workflow/runner changes were published before same-lineage closure records were committed. This is an admission contract failure, not a reason to relax policy.

## Action
Added a structured Brain learning record, this append-only development event and human-readable change documentation on the same PR branch. No code path or permission policy is bypassed.

## Evidence and outstanding checks
GitHub regression job had succeeded on preceding candidate db66601569308d1bc5a7a385f75d20e353724ecd. The final candidate still requires fresh Required, hygiene, v6 regression and applicable security results. Branch protection, deny-all path policy and the review gate remain in place. No merge or production patch.
