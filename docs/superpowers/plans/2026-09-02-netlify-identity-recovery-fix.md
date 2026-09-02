# Netlify Identity recovery fix plan

1. Reproduce and document the recovery/invite pre-emption race.
2. Add regression tests for recovery, invite, and ordinary login.
3. Add a deterministic fail-closed transform that prioritizes Identity token flows.
4. Apply the transform in the existing production auth build.
5. Run repository CI and portal/page regression gates.
6. Merge only after required checks pass.
7. Verify Netlify production deploy commit_ref equals merged main SHA.
8. Re-test with a fresh password recovery link because previously exposed/single-use tokens must not be reused.
