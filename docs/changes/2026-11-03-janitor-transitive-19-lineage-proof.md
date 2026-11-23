# 19 Janitor history deferrals — exact transitive successor evidence

**Incident:** #5320. **Owner:** existing Powerhouse Repository Janitor / ONE BRAIN (single writer). **Source:** native run 41546047078 (artifact 13188164749). The original workflow completed cleanup and observer successfully, but 19 closed terminal PRs were retained as `HISTORY_UNPROVEN_DEFER`, not reopened.

## Root cause
The positive-only search read a merged successor only when its `Supersedes` field named the original PR directly. All 19 old PRs are earlier links in **seven** historical chains. An intermediate may still be `open` with explicit `RETIRED` title, which is evidence of historical succession but not active ownership. A bounded list or negative indexed search can never prove global absence of an older successor.

## Live provider metadata and expected chain readback
- #3951 → #3958 → #3963 → #3970 (RETIRED) → **#3981 MERGED**; historical 3951,3958,3963.
- #3978 → #3985 (RETIRED) → **#3994 MERGED**; historical 3978.
- #3953 → #3962 → #3968 → #3971 → #3975 (RETIRED) → **#3980 MERGED**; historical 3953,3962,3968,3971.
- #3928 → #3930 → #3934 → #3937 → #3938 → #3940 → #3942 → #3945 → **#3947 MERGED**; historical 3928,3930,3934,3937,3938,3940,3942.
- #3959 → #3965 (RETIRED) → **#3974 MERGED**; historical 3959.
- #3992 → #3995 → #4002 (RETIRED) → **#4007 MERGED**; historical 3992,3995.
- #3948 → #3949 (RETIRED) → **#3952 MERGED**; historical 3948.

GitHub PRs, not user-authored assumptions, are source of the seven merged tips and each `Supersedes` edge. All names, obligations, states and intermediate retirement must be checked again by native GitHub readback on each Janitor run. Metadata alone does **not** prove byte-level delivery of every historic change or live portal functionality.

## Correction and safe gate
`tools/delivery/janitor-incident-agent.mjs` now traverses up to 32 strictly descending PR links, requires the exact `Obligation-ID`, merged+closed tip and explicit retirement for open intermediates, and returns `safe_to_reopen=false` always. The original workflow persists the full direct-readback proof chain with provenance into the existing artifact. Absent/mismatched/403/cyclic lineage stays deferred; no unsafe PATCH and no second writer/scheduler. The regression fixture replays all 19 and negative cases, plus direct #2225→#2353 compatibility.

## Acceptance and rollout truth
Candidate is not yet live. Run the original Required, CodeQL and full BRAIN exact-head; protected merge; original Janitor after merge; independent artifact readback showing 0 remaining eligible `HISTORY_UNPROVEN_DEFER`, owner ONE BRAIN learned occurrence and portal truth. Never call 19→0 or global GREEN from test fixtures alone. Archive-tag three HTTP403 cases remain separate incident #5333; provider ghosts and sampled drift remain unresolved until independently verified.
