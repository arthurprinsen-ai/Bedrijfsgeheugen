# First Time Right: protected GitHub admission, stage 2

## Purpose and root cause
Stage 1, original protected PR #5392, installed a bounded JS/TS/SQL prebuild checker, but deliberately did not call it from CI. Historical defects include a duplicate TypeScript `const revisionInput` that caused ACTIVE/HTTP503 boot failure and an unmatched `$function$` SQL terminator. Required admission can otherwise greenlight candidates that later fail at source or runtime.

## Narrow stage-2 change
The ORIGINAL `.github/workflows/powerhouse-delivery-hygiene.yml` admission job now invokes that already merged checker **from the exact trusted `github.workflow_sha` commit**, not a PR-controlled source module and not a moving branch alias. It compares candidate HEAD against the original admitted SHA, reads the original changed-path inventory, rejects nonregular/symlink/escaped candidate source paths, enforces same-candidate regressions, writes failure fingerprint/cause/evidence to the already-existing admission JSON and fails before expensive CI. This is not a new scheduler, provider, publisher, queue or writer.

## Safety and validation
- Positive: valid TypeScript source passes `PREBUILD_READY` but still needs native Required, BRAIN, CodeQL, protected merge and actual runtime/provider readback.
- Negative: original v601-style duplicate `const` is rejected without execution; missing regression and symlink/HEAD mismatch are rejected.
- Keep all GitHub protections, tenant and service-role boundaries, independent approval, source and identity controls, 0.940 Mira frame proof, duplicate gates, provider consent, circuit breakers, original writer lease.
- Protected PR candidate itself is **not live**. A protected merge followed by independently observed bad/good original PR admission probes and production/source/skill readback is necessary. If full BRAIN is red, leave this stage nonterminal and do not rewrite tests to silence errors.

Parent: #4198. Source: original stage-1 #5392. Learning: `brain/learning/2026-11-04-first-time-right-protected-admission-stage2-v1.json`. Regression: `tests/brain-first-time-right-protected-admission-stage2-20261104.test.mjs`.
