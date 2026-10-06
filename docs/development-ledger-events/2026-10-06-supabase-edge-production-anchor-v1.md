# 2026-10-06 — Supabase Edge production deployment anchor v1

Obligation-ID: supabase-edge-production-anchor-20261006-v1
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: b6f6ccbb17767cad90a679854033ad3044b52e73

Observed:
- manual authority run 37487286439 started on current main 03156e2b875718d20a9a3369f1f68f3660c721f4;
- that SHA had only skipped Supabase Preview check 112350343970 at the /branches URL;
- the authority correctly ignored that preview check but could never receive a new production check for an unrelated main commit;
- successful production deployment anchor 2b0539cb729b658bc5e85184406d8421e56f9d35 has check 112296747565;
- independent current provider readback remained byte-identical: publisher v130 and recovery-runner v21.

Repair:
- resolve exact-SHA success first;
- otherwise search bounded recent runtime history for the newest successful source-equivalent production anchor;
- require zero runtime diff between anchor and dispatch SHA;
- observe the anchor twice;
- preserve read-only --use-api byte parity and post-readback no-newer-runtime guard.

No provider deploy writer is added.
