# 2026-10-22 — final Netlify blog marker missing

- Existing obligation: daily-blog:2026-09-28:immutable-live-proof.
- Source: [GitHub run 39851092322](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39851092322), job 120077143423; 8 failed public reads reported `content_id marker missing: blog:aanzet-2026-emissieloze-trucks`.
- Protected main before change: `6cac871e506a1e4abb000b0533fcf540bc5bd93b`; published Netlify deploy `6ada641b27965d068e1f8f5b` from `8d6dc6dd...`. The public page itself is visible and source HTML carries the correct body marker; the deployed HTML does not satisfy that exact marker.
- Causal hypothesis: further HTML transformations run after the prior marker restoration.
- Candidate prevention: reuse the canonical final-artifact marker function at the **end** of both Netlify build paths, plus two positive/negative regression cases, preserving the native external readback.
- This entry records a candidate only. Exact protected merge, Netlify deployed artifact and watchdog-ledger proof must be independently read back before PROVEN.
