# Terminal closure: retired migration, protected successor — 22 October 2026

## Actual observed failure
Existing canonical terminal run [39840439339](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39840439339) job 120039732278 accepted prior CI, production and skill checks but failed migration-supersession identity with `UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS:4686:...`. PR #4686 is retired/closed/unmerged and explicitly superseded by protected-merged PR #4697 (merge `d41950ed...`), which adopted the exact SQL migration version `20261022173500` with intentionally corrected SQL content.

## Bounded repair
The **existing** `.github/workflows/obligation-terminal-closure.yml` now checks the direct `Supersedes` owner link, retired lease, exact migration path adoption in a real merged commit and exact Git blob parity with current protected main before ignoring a retired SQL draft. Retired SQL bytes are never treated as deployed migration truth. A different filename/version not adopted by the successor, source drift, an active candidate, ambiguous ownership or conflicting merged blobs still fail closed. Production migration provider APPLIED, source/function/ACL, OIDC terminal Brain evidence and protected Required/CodeQL stay mandatory.

## Verification
Executable RED→GREEN and negative canaries live in `tests/brain-terminal-migration-identity-v1.test.mjs`. The original failed replay is immutable audit evidence. Only after protected exact-head CI+CodeQL+merge, run **one** authorized replay for original PR #4697 through its existing terminal route; demand real terminal `FULFILLED` durable readback. No direct production SQL, second scheduler, duplicate incident registry or artificial green state.

Fingerprint: `delivery|terminal-closure|retired-superseded-migration-lineage|20261022-v1`. Parent P0: #4681. Separate commercial cron #46 / #4215 remains open.
