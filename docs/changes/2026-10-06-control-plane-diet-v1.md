# Control Plane Diet — structural reduction

The PR control plane now has exactly two admission authorities and five closed lifecycle/recovery authorities. Required test is the canonical PR admission orchestrator; Powerhouse CodeQL is the sole CodeQL authority on PR and merge queue. Read-only specialist assurance runs on merge_group. Portal DOM/visual proof and repository-writer verification consume successful Required runs via workflow_run instead of adding PR admission fan-out. Production Portal readback remains push/main only for deployable portal-v2 runtime changes.

The migration is explicitly scope-approved and keeps exact Change-Scope/Scope-Budget metadata, downward-only ratchets, exact-head identity and protected auto-merge.


## Terminal readback correction

The post-merge terminalizer now treats the Netlify project registry and ephemeral janitor as verifier-only control-plane files, not deployable runtime. This closes the false `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` failure from PR #3984 while preserving exact production readback for genuine Netlify runtime changes.
