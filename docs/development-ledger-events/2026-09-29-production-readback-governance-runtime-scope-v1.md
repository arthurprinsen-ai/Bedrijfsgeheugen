# 2026-09-29 — Production readback governance/runtime scope

Observed:
- repository borging was merged to protected main;
- internal readback scope reused the full git diff;
- governance paths ignored at workflow trigger level still activated website deployment internally.

Fix:
- derive runtimeChangedPaths before createDeliveryPlan;
- use runtimeChangedPaths for Netlify-runtime and website-risk checks;
- keep manual readback explicit;
- add regression coverage for mixed skills/system-map/docs closure;
- preserve fail-closed production proof for actual runtime changes.
