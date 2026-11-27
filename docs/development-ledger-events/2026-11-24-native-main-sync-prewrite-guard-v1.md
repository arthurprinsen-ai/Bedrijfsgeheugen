# 2026-11-24: original #4661 native main-sync guard

# Native main sync: prewrite lease required

Canonical issue #4661. Original #6140 admission failures 45448999301 and 45450729825. The original prewrite guard returned mutation permission for an outdated TERMINAL_DELIVERY lease; this is a confirmed permission defect, not proof of the actual caller. The existing supervisor now uses the guard after a fresh provider readback and rejects unavailable/truncated comparisons, renamed-path and shared-contract overlap. The original owner must acquire MAIN_SYNC before same-lineage update; exact head, target, owner and obligation are required. No drift-budget reset, protection changes, extra scheduler or automatic release claim. Native auto-merge arbitration remains unresolved. Protected checks and actual production proof required.
