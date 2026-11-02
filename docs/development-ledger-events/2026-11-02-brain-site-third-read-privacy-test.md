# ONE BRAIN original privacy-test incident, 2 November 2026

- Original merged PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5298, source main 9db4f32c4a25b05e9ce3bf3cca7ab64102dd66ca.
- Native full BRAIN run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41451145109, original backend job 125296963109, original test #3515 failed with actual provider call count 3 against obsolete expected 2.
- Root: new bounded original server-side website incident projection, test mock not upgraded. No observed real incident evidence leak is proven by this counter mismatch.
- Original fingerprint powerhouse|brain|portal-failure-coverage-third-allowlisted-read-unreflected-in-test|20261102-v1 recorded as OBSERVED. Preserve first failed run.
- Fix: third mock validates allowlisted fingerprint query and limit 3, exercises data redaction with synthetic private sentinel, preserves existing read-projection source, 3 independent proof statuses and no green for unproven incidents.
- No runtime authorization, tenant gate, writer or scheduler altered. Protected Required, CodeQL, full BRAIN, safe merge and independent live readback still required. Human docs in docs/changes and existing green-assurance skill.
