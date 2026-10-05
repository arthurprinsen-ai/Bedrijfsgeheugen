# Supabase Preview applicability ARG_MAX recovery

## Failure
Large PR checksets caused the shared Supabase Preview Applicability workflow to fail before evaluating the provider result. The workflow stored the complete GitHub check-runs JSON in an environment variable and then launched Node with that environment. On large responses the process exceeded the operating-system argument/environment size limit and failed with `Argument list too long`.

## Structural fix
The workflow now writes the GitHub check-runs response to `RUNNER_TEMP` and has Node parse the temporary JSON file. The proof contract is unchanged:

- only the `Supabase Preview` check is considered;
- it must be emitted by the `supabase` GitHub App;
- only `success` is accepted as proof;
- failure/cancelled/timed_out/action_required/stale/startup_failure remain hard failures;
- skipped/neutral remain non-proof;
- missing/pending remain bounded polling states.

This prevents payload-size failures without weakening runtime proof.
