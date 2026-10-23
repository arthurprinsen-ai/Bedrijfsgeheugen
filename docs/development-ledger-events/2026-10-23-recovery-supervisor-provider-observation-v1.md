# Recovery measurement improvement ledger — 2026-10-23
Fingerprint: github|recovery-supervisor|missing-repeat-drift-observations|20261023-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120
Observed prior run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39960974891
Existing run: ~246 seconds, 58 drift-without-lease denials, 24 unleased failed gate refusals, no observed native CAS attempts.
Changes: existing Supervisor adds non-authoritative aggregate counters and JSON job summary; tests verify strict CAS, budget, no second scheduler.
State: CANDIDATE, not promoted, no speedup or customer uplift claimed.
