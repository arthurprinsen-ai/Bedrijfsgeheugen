# 2026-11-15 — original native Supabase 869 source-lock gap
- Owner: original Supabase migration source lock / Reliability + Data Quality, existing P0 #4198.
- Protected native provider SQL 2026-11-15 15:27:58.083020 UTC: 869 actually applied migrations; exact version 20261115162000 / personal_observation_source_no_resurrection_v1.
- Existing Git source lock: 868 entries, last original 20261115121500; original 868 preserved.
- Symptom: unrelated PR #5872 Required run 43729797175 failed protected migration-lock gate 868 vs 869. Do not relax tests or mark provider unverified.
- Repair: append actual 869 version/name only, set captured_at to source-readback UTC; protected source PR, CodeQL/Required and exact native parity evidence. No database SQL re-execution.
- Consumer: existing source-lock gate then original #5872 code and next natural #140 agent/Heartbeat proof. Business effect remains OPEN.
