# 2026-09-20 — ONE BRAIN closure/health recovery

Fingerprint: `powerhouse-control-plane-closure-health-v1`.

Incident: runtime health expected reconciliation worker v1 while production runs v2; terminal closure failed on a closed-unmerged superseded migration even though its stable migration identity is canonicalized on current main.

Fix: runtime-health contract aligns to v2; terminalizer resolves an unmerged supersession migration by stable migration name only when current main contains exactly one canonical match. Missing or ambiguous matches remain fail-closed.

Evidence: production health moved from 17/18 jobs to 18/18 jobs after the runtime migration. Terminal closure regression is carried by the workflow change in the same candidate.
