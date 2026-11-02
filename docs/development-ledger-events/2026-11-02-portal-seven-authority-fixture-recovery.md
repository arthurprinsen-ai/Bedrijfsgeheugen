# 2026-11-02 – Portal seven-view original BRAIN source fixture drift

- **Signature:** `powerhouse|brain|portal-seven-authority-source-fixture-drift|20261102-v1` within original #4439.
- **Observation:** original BRAIN full backend #41413309140 had 31/5365 fail; two Portal integration assertions expected five private view calls and READABLE on a five-only fixture.
- **Root cause:** canonical original private readmodel requires seven independent views including `powerhouse_loop_integrity_health_v1` and `powerhouse_terminal_control_plane_health_v1`, but fixture outdated.
- **Live source verification:** all seven database views exist in original Supabase project; every one denies direct anon/authenticated SELECT.
- **Fix:** synthetic tests now supply the two originally missing views and assert exact seven GETs; negative guard proves missing any required view => PARTIAL and that source-only readback never proves end-to-end customer or paid revenue result.
- **Learning:** original AGENTS, Netlify Truth skill, ONE BRAIN JSON and human runbook are in one protected candidate. No runtime, SQL, ACL, scheduler, publisher, incident status or customer KPI mutations.
- **Proof outstanding:** exact protected tests, original full BRAIN, terminal, authenticated Portal readback, independent customer effect; retain red state until proven.
