# One commercial closed loop v2 — migration history parity

Date: 2026-10-05

Production already runs the canonical `powerhouse-one-commercial-closed-loop-v2` runtime and post-merge readback is `VERIFIED / confidence 1`.

The remaining parity gap was migration identity only: Supabase migration history registered the applied migration as version `20261005144606` with name `powerhouse_one_commercial_closed_loop_v2`, while GitHub stored the same SQL as `20261005161500_powerhouse_one_commercial_closed_loop_v2.sql`.

This recovery renames the repository migration artifact to the exact production version. It does not reapply DDL and does not change production runtime behavior.

Invariant: runtime SQL + migration name + migration version + repository artifact must describe one canonical migration identity before terminal repository parity is declared.
