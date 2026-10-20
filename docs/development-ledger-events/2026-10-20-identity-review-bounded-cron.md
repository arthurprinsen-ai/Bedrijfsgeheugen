# 2026-10-20 — Contact review cron load and recovery
P0: #4198.
Independent production evidence: 2026-10-20 postgres cron startup/statement/lock timeouts; job 138 originally 2x500 pulses and 4x500 authority-review loops; verified interim production bounded job active with one pulse(200), one authority(200), schedule 2,17,32,42,52,57. Additional review attempt returned BUSY (advisory lock); do NOT claim that 200 were processed. Preserve scheduled owner and daily review goal with six slots and minute 52 dephased to 47.
Source version: migration 20261020114500_identity_review_bounded_cron_v1.sql, deterministic regression, Brain learning, system map and skill. Full external sends remain P0 pending true provider+consent+receipt.

- Correction from independent SQL readback: pre-migration authority call was **500**, not 200, although connection pulse was 200 and loop count was 1; therefore previous claimed 400 total was incorrect. The migration and static regression now replace/verify `::date,500);` -> `::date,200);` and `v_date,500);` -> `v_date,200);`. Actual 400 ceiling is a target pending new production readback.
