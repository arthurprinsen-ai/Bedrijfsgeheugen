# 2026-09-22 — API-source release identity marker

- Fingerprint: api-source-release-identity-marker-v1
- Root cause: Netlify API-source deploy 6ab254dd2116c8947f08bf50 had commit_ref=null; final release evidence required COMMIT_REF/HEAD and the build exited 2.
- Fix: stamp exact GitHub SHA in .bg-source-commit; resolve release identity from provider env or marker; fail on mismatch/missing identity.
- Duplicate prevention: canonical Netlify side effect is explicit workflow_dispatch deploy=true only, not push.
- Evidence: failed run 35714761271, deploy 6ab254dd2116c8947f08bf50, build 6ab254dd2116c8947f08bf4e.
- Terminal proof: exact current-main provider deploy ready plus release.json and public blog readback.
